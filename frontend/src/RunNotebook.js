import React, { useState } from 'react';
import axios from 'axios';

const RunNotebook = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const runNotebook = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/run-notebook');
            setResult(response.data);
        } catch (error) {
            console.error('Error running notebook:', error);
            setResult({ status: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={runNotebook} disabled={loading}>
                {loading ? 'Running...' : 'Run Notebook'}
            </button>
            {result && (
                <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
        </div>
    );
};

export default RunNotebook;
