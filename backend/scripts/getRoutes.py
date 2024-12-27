import pandas as pd
from pathlib import Path

# globals
backend_dir = Path(__file__).resolve().parents[1]
input = Path(backend_dir,'data_in')
output = Path(backend_dir, 'data_out')
data_set = 'mdb-2253'

def main():
    routes = pd.read_csv(Path(input, data_set, 'routes.txt'), sep=',')
    route_id = routes['route_id']
    route_id.to_csv(Path(output, 'bus-routes.csv'), index=False)

if __name__=="__main__":
    main()
