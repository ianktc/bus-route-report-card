from datetime import datetime
from pathlib import Path
import pandas as pd
import sys

# globals
backend_dir = Path(__file__).resolve().parents[1]
input = Path(backend_dir,'data_in')
output = Path(backend_dir, 'data_out')
data_set = 'mdb-2253'

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

def main(target_route):
    
    clean_data_out()

    # Read txt files
    routes = pd.read_csv(Path(input, data_set, 'routes.txt').resolve(), sep=',')
    trips = pd.read_csv(Path(input, data_set, 'trips.txt'), sep=',')
    stop_times = pd.read_csv(Path(input, data_set, 'stop_times.txt'), sep=',')
    stops = pd.read_csv(Path(input, data_set, 'stops.txt'), sep=',')

    # Filter for particular route (eg. 510)
    route_id = routes.loc[routes['route_short_name'] == int(target_route), 'route_id']

    # Get all trip_ids with route_id = target route
    route_trips = trips.loc[trips['route_id'] == route_id.iloc[0], 'trip_id']

    # Get route stop times from stop_times csv
    route_stop_times = stop_times[stop_times['trip_id'].isin(route_trips)]

    # Join with stops csv to get stop information
    route_stop_times = route_stop_times.merge(stops, on='stop_id', how='left')

    # Apply time normalization (for >24 hours) and convert to datetime format
    route_stop_times["arrival_time"] = route_stop_times["arrival_time"].apply(normalize_time)
    route_stop_times["arrival_time"] = pd.to_datetime(route_stop_times["arrival_time"], format="%H:%M:%S").dt.time

    # Combine arrival_time with today's date to create datetime objects
    today = pd.Timestamp.now().normalize()  # Get today's date at 00:00:00
    route_stop_times["arrival_datetime"] = route_stop_times["arrival_time"].apply(
        lambda t: datetime.combine(today, t)
    )

    # Filter rows to 1 minute in future
    current_time = pd.Timestamp.now()
    time_diff = (route_stop_times["arrival_datetime"] - current_time)
    route_stop_times = route_stop_times[(time_diff <= pd.Timedelta(minutes=1)) & (time_diff > pd.Timedelta(0))]

    # Display arrival/departure times and lat/lon coordinates for each stop 
    result = route_stop_times[['trip_id', 'stop_id', 'stop_name', 'arrival_time', 'departure_time', 'stop_lat', 'stop_lon', 'stop_sequence']]

    # Save to csv
    result.reset_index(drop = True, inplace = True)
    result.to_csv(Path(output, str(target_route) + "-static.csv"))

if __name__=="__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_csv.py <target_route>")
        target_route = '510'
    else:
        print("target route found %s of type %s"%(sys.argv[1], type(sys.argv[1])))
        target_route = str(sys.argv[1])
    
    main(target_route)
