import pandas as pd
from geopy.distance import geodesic
from pathlib import Path
import sys

# globals
backend_dir = Path(__file__).resolve().parents[1]
input = Path(backend_dir,'data_in')
output = Path(backend_dir, 'data_out')
data_set = 'mdb-2253'

def find_distance_to_stop(group):
    group['distance_to_stop'] = group.apply(
        lambda row: geodesic(
            (row['vehicle_latitude'], row['vehicle_longitude']),
            (row['stop_lat_trip'], row['stop_lon_trip'])
        ).meters,
        axis=1
    )
    return group

def main(target_route):

    # Read csv 
    rt_trips = pd.read_csv(Path(output, str(target_route) + '-rt.csv'), sep=',')
    static_trips = pd.read_csv(Path(output, str(target_route) + '-static.csv'), sep=',')
    stops = pd.read_csv(Path(input, data_set + '/stops.txt'), sep=',')
    stop_times = pd.read_csv(Path(input, data_set + '/stop_times.txt'), sep=',')

    # Merge rt info with static info
    rt_static_merged_trips = rt_trips.merge(static_trips, on='trip_id', how='outer')
    rt_static_merged_trips = rt_static_merged_trips.drop(['Unnamed: 0_x', 'Unnamed: 0_y', 'route_id'], axis=1).dropna()
    rt_static_merged_trips.reset_index(drop = True, inplace = True)
    rt_static_merged_trips.to_csv(Path(output, str(target_route) + '-rt-static.csv'))

    # Merge stop_times with stops
    stop_info = stop_times.merge(stops, on="stop_id")
    stop_info = stop_info[["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence", "stop_lat", "stop_lon", "stop_name"]]

    # Merge stop_info and rt_static_trips on trip_id
    merged = stop_info.merge(rt_static_merged_trips, on="trip_id", suffixes=("_trip", "_rt"))
    merged = merged[["trip_id", "now", "arrival_time_trip", "departure_time_trip", "stop_sequence_trip", "stop_sequence_rt",
                    "stop_lat_trip", "stop_lon_trip", "stop_name_trip", "vehicle_latitude", "vehicle_longitude"]]

    # Filter rows where rt stop_sequence is within 5 of the intended stop_sequence
    filtered = merged[
        ((merged["stop_sequence_rt"] - merged["stop_sequence_trip"]).abs() <= 7)
    ]
    filtered_data = filtered[["trip_id", "stop_sequence_trip", "now", "arrival_time_trip", "departure_time_trip", "stop_name_trip", "stop_lat_trip", "stop_lon_trip", "vehicle_latitude", "vehicle_longitude"]]

    # Calculate distance to each stop
    calculated_distance = filtered_data.groupby("trip_id").apply(find_distance_to_stop, include_groups=False).reset_index(drop=False).drop(columns=['level_1'])

    # calculated_distance.to_csv(output + '/' + 'calculated_distance.csv')

    # Identify which stop is the closest (compare distance_to_stop and mark stop_sequence)
    calculated_distance['closest_stop_sequence'] = (
        calculated_distance.groupby('trip_id')['distance_to_stop']
        .transform(lambda x: calculated_distance.loc[x.idxmin(), 'stop_sequence_trip'])
    )

    # Save the realtime stop name of only the closest stop
    calculated_distance['stop_name_trip'] = (
        calculated_distance.groupby('trip_id')
            .apply(lambda group: group.loc[group['stop_sequence_trip'] == group['closest_stop_sequence'], 'stop_name_trip'], include_groups=False)
            .reset_index(level=0, drop=True)
    )
    # calculated_distance.to_csv(output + '/' + 'calculated_distance.csv')

    rt_static_merged_trips_concise = rt_static_merged_trips[['trip_id', 'stop_sequence', 'stop_name']]
    calculated_distance_concise = calculated_distance[['trip_id', 'closest_stop_sequence', 'stop_name_trip']].dropna()
    comparison = (calculated_distance_concise.merge(rt_static_merged_trips_concise, on='trip_id', how='outer'))[['trip_id', 'stop_sequence', 'stop_name', 'closest_stop_sequence', 'stop_name_trip']]

    # Evaluate whether bus is on/ahead/behind schedule
    result = comparison.drop_duplicates()
    temp = result.copy()
    temp.loc[:, 'status'] = result.apply(
        lambda row: 
            'on' if row['closest_stop_sequence'] == row['stop_sequence'] 
            else
            'ahead' if row['closest_stop_sequence'] > row['stop_sequence'] 
            else
            'behind',
        axis=1
    )

    # Clean up analysis-result
    temp = temp.rename({'closest_stop_sequence': 'realtime_stop_sequence',
                    'stop_name_trip': 'realtime_stop_name', 
                    'stop_sequence': 'static_stop_sequence', 
                    'stop_name': 'static_stop_name'}, axis=1)
    temp['static_stop_sequence'] = temp['static_stop_sequence'].astype(int)
    result = temp.copy()

    # Save to csv
    result.reset_index(drop = True, inplace = True)
    result.to_csv(Path(output, 'analysis-result.csv'))

if __name__=="__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_csv.py <target_route>")
        target_route = '510'
    else:
        target_route = sys.argv[1]
    
    main(target_route)
