from google.transit import gtfs_realtime_pb2
import requests
import pandas as pd

output = '../data_out'
target_route = 510

def parse_feed_and_filter_by_route(feed):
    matching_entities = []
    for entity in feed.entity:
        if entity.HasField("vehicle"):
            vehicle = entity.vehicle
            if vehicle.trip.route_id == str(target_route):
                # print(vehicle.trip)
                matching_entities.append({
                    "id": entity.id,
                    "trip_id": vehicle.trip.trip_id,
                    "route_id": vehicle.trip.route_id,
                    "latitude": vehicle.position.latitude,
                    "longitude": vehicle.position.longitude,
                    "occupancy_status": vehicle.occupancy_status
                })
    return matching_entities

def main():

    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get('https://bustime.ttc.ca/gtfsrt/vehicles')
    feed.ParseFromString(response.content)
    current_time = pd.Timestamp.now().time()

    vehicles_on_route = parse_feed_and_filter_by_route(feed)

    # Mapping from dictionary keys to desired column names
    key_to_column = {
        "id": "vehicle_id",
        "trip_id": "trip_id",
        "route_id": "route_id",
        "latitude": "vehicle_latitude",
        "longitude": "vehicle_longitude"
    }

    # Create the DataFrame, remove duplicate vehicles
    result = pd.DataFrame(
        [{new_key: d.get(old_key) for old_key, new_key in key_to_column.items()} for d in vehicles_on_route])
    result.drop_duplicates()

    # Add current timestamp
    result['now'] = current_time

    # Save to csv
    result.reset_index(drop = True, inplace = True)
    result.to_csv(output + '/' + str(target_route) + "-rt.csv")

if __name__=="__main__":
    main()
    