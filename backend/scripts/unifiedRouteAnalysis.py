import pandas as pd
from datetime import datetime, date, time 
from pathlib import Path
from scipy.spatial import KDTree
from geopy.distance import geodesic
from google.transit import gtfs_realtime_pb2
import requests
import sys


# globals
backend_dir = Path(__file__).resolve().parents[1]
input = Path(backend_dir,'data_in')
output = Path(backend_dir, 'data_out')
data_set = 'mdb-2253'
n_stops = 7

# TTC Occupancy Enums
# EMPTY (0), FEW SEATS AVAILABLE (2), FULL (5)

# WEEKDAY M-F
WEEKDAY_PEAK = 3.5 # 7AM - 10AM and 4PM - 7PM
WEEKDAY_SHOULDER = 1 # 10AM - 4PM
WEEKDAY_OFF_PEAK = 1 # 7PM - 7AM

# WEEKEND S-S
WEEKEND_PEAK = 1.5 # 10AM - 4PM
WEEKEND_OFF_PEAK = 1 # 4PM - 10AM

# ===============================================================

def clean_data_out():
    for file_path in output.iterdir():
        if file_path.is_file():  
            file_path.unlink() 

def normalize_time(time_str):
    try:
        # Split time into components
        h, m, s = map(int, time_str.split(":"))
        # Normalize hours to wrap around at 24
        h %= 24
        # Return normalized time as a string
        return f"{h:02}:{m:02}:{s:02}"
    except Exception as e:
        print(f"Invalid time format: {time_str}")
        return None
    
def parse_feed_and_filter_by_route(feed, target_route_id):
    matching_entities = []
    for entity in feed.entity:
        if entity.HasField('vehicle'):
            vehicle = entity.vehicle
            if vehicle.trip.route_id == str(target_route_id):
                # print("occupancy is ", str(vehicle.occupancy_status))
                matching_entities.append({
                    'id': entity.id,
                    'trip_id': vehicle.trip.trip_id,
                    'route_id': vehicle.trip.route_id,
                    'latitude': vehicle.position.latitude,
                    'longitude': vehicle.position.longitude,
                    'occupancy_status': str(vehicle.occupancy_status)
                })
    return matching_entities

def find_distance_to_stop(group):
    group['distance_to_stop'] = group.apply(
        lambda row: geodesic(
            (row['vehicle_latitude'], row['vehicle_longitude']),
            (row['stop_lat_trip'], row['stop_lon_trip'])
        ).meters,
        axis=1
    )
    return group

def kd_tree_range_query(df, threshold_degrees):
    coords = df[['vehicle_latitude','vehicle_longitude']].to_numpy()
    tree = KDTree(coords)
    return tree.query_pairs(threshold_degrees)

def calculate_distance(row):
    if pd.isna(row['previous_stop_lat']) or pd.isna(row['previous_stop_lon']):
        return 0
    coord1 = (row['stop_lat'], row['stop_lon'])
    coord2 = (row['previous_stop_lat'], row['previous_stop_lon'])
    return geodesic(coord1, coord2).meters

# ===============================================================

def main(target_route):

    clean_data_out()

    # Read txt files
    routes = pd.read_csv(Path(input, data_set, 'routes.txt').resolve(), sep=',')
    trips = pd.read_csv(Path(input, data_set, 'trips.txt'), sep=',')
    stop_times = pd.read_csv(Path(input, data_set, 'stop_times.txt'), sep=',')
    stops = pd.read_csv(Path(input, data_set, 'stops.txt'), sep=',')

    # ================================ Static GTFS ===============================

    # Get route_id given the route_short_name (eg 510) They are almost always the same...
    route_id = routes.loc[routes['route_short_name'] == int(target_route), 'route_id'].iloc[0]

    # Get all trip_ids with route_id = target route
    route_trips = trips.loc[trips['route_id'] == route_id][['trip_id', 'direction_id']]

    # Merge with stop_times to get arrival/departure times
    route_stop_times = stop_times.merge(route_trips, on='trip_id')[['trip_id', 'direction_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence']]

    # Merge with stops to get stop locations
    route_stop_info = route_stop_times.merge(stops[['stop_id', 'stop_name', 'stop_lat', 'stop_lon']], on='stop_id', how='inner')

    # Apply time normalization (for >24 hours) and convert to datetime format
    route_stop_info["arrival_time"] = route_stop_info["arrival_time"].apply(normalize_time)
    route_stop_info["arrival_time"] = pd.to_datetime(route_stop_info["arrival_time"], format="%H:%M:%S").dt.time

    # Combine arrival_time with today's date to create datetime objects
    today = pd.Timestamp.now().normalize()  # Get today's date at 00:00:00
    route_stop_info["arrival_datetime"] = route_stop_info["arrival_time"].apply(
        lambda t: datetime.combine(today, t)
    )

    # Filter rows to 1 minute in future
    current_time = pd.Timestamp.now()
    time_diff = (route_stop_info["arrival_datetime"] - current_time)
    route_stop_info = route_stop_info[(time_diff <= pd.Timedelta(minutes=1)) & (time_diff > pd.Timedelta(0))]

    # Display arrival/departure times and lat/lon coordinates for each stop 
    static_result = route_stop_info[['trip_id', 'stop_id', 'direction_id', 'stop_name', 'arrival_time', 'departure_time', 'stop_lat', 'stop_lon', 'stop_sequence']]
    static_result = static_result.sort_values(by='direction_id')

    # Count unique trip_ids just out of curiosity
    unique_trip_count = static_result["trip_id"].nunique()
    # print(unique_trip_count)

    # Save to csv
    static_result.reset_index(drop = True, inplace = True)
    static_result.to_csv(Path(output, str(target_route) + "-static.csv"))

    # ================================ Realtime GTFS ===============================

    # Parse realtime protobuf feed
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get('https://bustime.ttc.ca/gtfsrt/vehicles')
    feed.ParseFromString(response.content)
    current_time = pd.Timestamp.now().time()

    # Get all vehicles currently on this route
    vehicles_on_route = parse_feed_and_filter_by_route(feed, target_route)
    
    # Mapping from dictionary keys to desired column names
    key_to_column = {
        'id': 'vehicle_id',
        'trip_id': 'trip_id',
        'route_id': 'route_id',
        'latitude': 'vehicle_latitude',
        'longitude': 'vehicle_longitude',
        'occupancy_status': 'occupancy_status'
    }

    # Create the DataFrame, remove duplicate vehicles
    realtime_vehicles = pd.DataFrame(
        [{new_key: d.get(old_key) for old_key, new_key in key_to_column.items()} for d in vehicles_on_route])
    realtime_vehicles.drop_duplicates()

    # Add current timestampt to df and convert trip_id from obj to int
    realtime_vehicles['now'] = current_time
    realtime_vehicles['trip_id'] = realtime_vehicles['trip_id'].astype(str).astype(int)

    # Merge with trips to get direction_id
    realtime_result = trips.merge(realtime_vehicles, on='trip_id', how='inner')

    # Count unique trip_ids
    unique_trip_count = realtime_result["trip_id"].nunique()
    # print(unique_trip_count)

    # Save to csv
    realtime_result.to_csv(Path(output, str(target_route) + "-rt.csv"))

    # ================================ On Time Performance Analysis ===============================

    # Merge rt info with static info
    rt_static_merged_trips = realtime_result.merge(static_result, on='trip_id', how='outer')
    rt_static_merged_trips = rt_static_merged_trips.dropna()
    rt_static_merged_trips.reset_index(drop = True, inplace = True)
    rt_static_merged_trips.to_csv(Path(output, str(target_route) + '-rt-static.csv'))

    # Merge stop_times with stops
    stop_info = stop_times.merge(stops, on="stop_id")
    stop_info = stop_info[["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence", "stop_lat", "stop_lon", "stop_name"]]

    # Merge stop_info and rt_static_trips on trip_id
    merged = stop_info.merge(rt_static_merged_trips, on="trip_id", suffixes=("_trip", "_rt"))
    merged = merged[["trip_id", "now", "arrival_time_trip", "departure_time_trip", "stop_sequence_trip", "stop_sequence_rt",
                    "stop_lat_trip", "stop_lon_trip", "stop_name_trip", "vehicle_latitude", "vehicle_longitude"]]

    # Filter rows where rt stop_sequence is within n stops of the intended stop_sequence
    filtered = merged[
        ((merged["stop_sequence_rt"] - merged["stop_sequence_trip"]).abs() <= n_stops)
    ]
    filtered_data = filtered[["trip_id", "stop_sequence_trip", "now", "arrival_time_trip", "departure_time_trip", "stop_name_trip", "stop_lat_trip", "stop_lon_trip", "vehicle_latitude", "vehicle_longitude"]]
    # filtered_data.to_csv(Path(output, 'filtered_data.csv'))

    # Calculate distance to each stop
    calculated_distance = filtered_data.groupby("trip_id").apply(find_distance_to_stop, include_groups=False).reset_index(drop=False)
    # calculated_distance = calculated_distance.drop(columns=['level_1'])

    # Identify which stop is the closest (by stop_sequence)
    calculated_distance['closest_stop_sequence'] = (
        calculated_distance.groupby('trip_id')['distance_to_stop']
        .transform(lambda x: calculated_distance.loc[x.idxmin(), 'stop_sequence_trip'])
    )
    calculated_distance.reset_index(drop = True, inplace = True)

    # Save the realtime stop name of only the closest stop
    calculated_distance['stop_name_trip'] = (
        calculated_distance.groupby('trip_id')
            .apply(lambda group: group.loc[group['stop_sequence_trip'] == group['closest_stop_sequence'], 'stop_name_trip'], include_groups=False)
            .reset_index(level=0, drop=True)
    )
    # calculated_distance.to_csv(Path(output, 'calculated_distance.csv'))

    rt_static_merged_trips_concise = rt_static_merged_trips[['trip_id', 'stop_sequence', 'stop_name']]
    calculated_distance_concise = calculated_distance[['trip_id', 'closest_stop_sequence', 'stop_name_trip']].dropna()
    comparison = (calculated_distance_concise.merge(rt_static_merged_trips_concise, on='trip_id', how='outer'))[['trip_id', 'stop_sequence', 'stop_name', 'closest_stop_sequence', 'stop_name_trip']]
    # comparison.to_csv(Path(output, 'comparison.csv'))

    # Evaluate whether bus is on/ahead/behind schedule
    otp_result = comparison.drop_duplicates()
    temp = otp_result.copy()
    temp.loc[:, 'status'] = otp_result.apply(
        lambda row: 
            'on' if row['closest_stop_sequence'] == row['stop_sequence'] 
            else
            'ahead' if row['closest_stop_sequence'] > row['stop_sequence'] 
            else
            'behind',
        axis=1
    )

    temp = temp.rename({'closest_stop_sequence': 'realtime_stop_sequence',
                        'stop_name_trip': 'realtime_stop_name', 
                        'stop_sequence': 'static_stop_sequence', 
                        'stop_name': 'static_stop_name'}, axis=1)
    temp['static_stop_sequence'] = temp['static_stop_sequence'].astype(int)
    otp_result = temp.copy()

    # Save to csv
    otp_result.reset_index(drop = True, inplace = True)
    otp_result.to_csv(Path(output, 'otp-analysis-result.csv'))

    # ================================ Bus Bunching Analysis ===============================

    realtime_result.groupby('direction_id').get_group(0)[['vehicle_latitude','vehicle_longitude']].to_csv(Path(output, 'direction_0_coords.csv'), index=False)
    realtime_result.groupby('direction_id').get_group(1)[['vehicle_latitude','vehicle_longitude']].to_csv(Path(output, 'direction_1_coords.csv'), index=False)

    # Get stop_sequence and stop_id of all stops on this route using the index 0 trip_id from route_trips
    stop_instances = stop_times[stop_times['trip_id'] == route_trips.iloc[0]['trip_id']][['stop_id', 'stop_sequence']]

    # Merge stop_instances with stops on stop_id to get stop coordinates
    target_stop_info = stop_instances.merge(stops[['stop_id', 'stop_lat', 'stop_lon']], on='stop_id')[['stop_sequence', 'stop_lat', 'stop_lon']]

    # Shift the DataFrame to get the previous row
    target_stop_info['previous_stop_lat'] = target_stop_info['stop_lat'].shift(1)
    target_stop_info['previous_stop_lon'] = target_stop_info['stop_lon'].shift(1)

    # Apply the distance function
    target_stop_info['distance_to_previous_stop'] = target_stop_info.apply(calculate_distance, axis=1)
    # target_stop_info.to_csv(Path(output, 'target_stop_info.csv'))

    # Calculate average inter stop distances for route
    threshold_km = target_stop_info['distance_to_previous_stop'].mean()/1000
    threshold_degrees = threshold_km / 111  # Convert km to degrees

    # Create kd tree and make range query for bunched buses for each direction
    # print(rt_trips)
    result = realtime_result.groupby('direction_id').apply(lambda group: kd_tree_range_query(group, threshold_degrees), include_groups=False)
    print(result.loc[0])
    print(result.loc[1])
    print("%s bunched bus pairs out of %s total buses running on route %s" %(len(result.loc[0]) + len(result.loc[1]), len(realtime_result), target_route))

    # ================================ Vehicle Occupancy Analysis ===============================

    # Analyze vehicle occupancy by marking current occupancy status to expected occupancy
    df_now = (pd.to_datetime(realtime_result['now'], format="%H:%M:%S.%f").dt.time).iloc[0]

    # Combine with today's date to create a datetime object
    combined_datetime = datetime.combine(date.today(), df_now)
    resulting_timestamp = pd.Timestamp(combined_datetime)

    timestamp = resulting_timestamp.time()
    realtime_result['occupancy_status'] = realtime_result['occupancy_status'].astype(str).astype(int)
    average_vehicle_occupancy = realtime_result['occupancy_status'].mean()

    time_7am = time(7, 0)
    time_10am = time(10, 0)
    time_4pm = time(16, 0)
    time_7pm = time(19, 0)

    if(resulting_timestamp.weekday() < 5):
        if((timestamp > time_7am and timestamp  < time_10am) or (timestamp > time_4pm and timestamp < time_7pm)):
            current_time_bucket = WEEKDAY_PEAK
        elif(timestamp > time_10am and timestamp < time_4pm):
            current_time_bucket = WEEKDAY_SHOULDER
        else:
            current_time_bucket = WEEKDAY_OFF_PEAK
    else:
        if(timestamp > time_10am and timestamp < time_4pm):
            current_time_bucket = WEEKEND_PEAK
        else:
            current_time_bucket = WEEKEND_OFF_PEAK

    print('The current expected occupancy is %s while the actual occupancy on route %s is %s' %(current_time_bucket, target_route, average_vehicle_occupancy))

    # ================================ Service Guarantee Analysis ===============================

    num_static_trips = len(static_result)
    # print(num_static_trips)
    num_realtime_trips = len(realtime_result)
    # print(num_realtime_trips)
    num_static_realtime_trips = len(rt_static_merged_trips)
    # print(num_static_realtime_trips)

    print('Percentage of static trips represented by scheduled realtime trips is {:.2f}%'.format(num_static_realtime_trips / num_static_trips * 100))
    print('Additional (unscheduled) realtime trips account for {:.2f}% of the realtime trips'.format((num_realtime_trips - num_static_realtime_trips) / num_realtime_trips * 100))
    print('Percentage of static trips represented by both scheduled and unscheduled realtime trips is {:.2f}%'.format(num_realtime_trips / num_static_trips * 100))

if __name__=="__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_csv.py <target_route>")
        target_route = '510'
    else:
        target_route = sys.argv[1]
    
    main(target_route)
    