import React, { useState } from 'react'
import axios from 'axios'
import RouteSelectComponent from './SelectRoute';

function RunScriptComponent({ onScriptExecution }) {
    const [loading, setLoading] = useState(false);

    const executeScript = async (selectedOption) => {
        try {
            
            setLoading(true);
            console.log("Making a post request with target route ", selectedOption)
            const run_script_response = await axios({
                method: 'post',
                url: 'http://localhost:5000/run-script',
                data: {
                  target_route: selectedOption.route_id
                }
            });

            console.log("response is: \n" + run_script_response.status)
            onScriptExecution(run_script_response.status === 200 ? true : false)
            setLoading(false);
            
        } catch (error) {
            console.error('Error running the script or getting the csv files:', error.response);
            setLoading(false);
        }
    };

    return (
        <div>
            <h4>{loading ? 'Loading...' : 'Fetch CSV Data'}</h4> 
            <RouteSelectComponent onChange = {executeScript} />
        </div>
    );
}

export default RunScriptComponent;
