from flask import Flask, send_file, request, jsonify
from pathlib import Path
import subprocess
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes

data_out = Path(Path(__file__).resolve().parent, 'data_out')

def get_csv(csv_name):
    file_path = str(Path(data_out, csv_name))
    try:
        print(file_path)
        return send_file(file_path, as_attachment=False, mimetype='text/csv')
    except FileNotFoundError:
        return {"error": "File not found"}, 404

@app.route('/run-script', methods=['POST'])
def run_script():
    try:
        # Extract data from the POST request
        data = request.json
        target_route = str(data.get('target_route'))
        print("target route is " + target_route)

        # Pass arguments to the Python script
        subprocess.run(["python", "scripts/static.py", target_route], check=True)
        subprocess.run(["python", "scripts/realtime.py", target_route], check=True)
        subprocess.run(["python", "scripts/analysis.py", target_route], check=True)
        csv_name = 'analysis-result.csv'
        return get_csv(csv_name)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get-routes', methods=['GET'])
def get_routes():
    try:
        # Pass arguments to the Python script
        subprocess.run(["python", "scripts/getRoutes.py"], check=True)
        csv_name = 'bus-routes.csv'
        return get_csv(csv_name)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
