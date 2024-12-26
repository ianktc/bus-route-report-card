from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/run-notebook', methods=['POST'])
def run_notebook():
    try:
        # Extract data from the POST request
        data = request.json
        target_route = data.get('arg1')

        # Pass arguments to the Python script
        subprocess.run(["python", "scripts/static.py", target_route], check=True)
        return jsonify({"status": "success", "message": "Script executed successfully."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
