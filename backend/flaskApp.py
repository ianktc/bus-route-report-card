from flask import Flask, request, jsonify
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor

app = Flask(__name__)

@app.route('/run-notebook', methods=['POST'])
def run_notebook():
    # Load the Jupyter notebook file
    notebook_path = 'ttc-rt.ipynb'
    with open(notebook_path) as f:
        notebook = nbformat.read(f, as_version=4)
    
    # Create an ExecutePreprocessor instance
    ep = ExecutePreprocessor(timeout=600, kernel_name='python3')

    try:
        # Execute the notebook
        ep.preprocess(notebook)
        # Optionally return specific results (e.g., cell outputs)
        outputs = [cell['outputs'] for cell in notebook.cells if 'outputs' in cell]
        print('notebook executed')
        return jsonify({"status": "success", "outputs": outputs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
