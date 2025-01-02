import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RouteSelectComponent from './SelectRoute';

function RunScriptComponent({ onScriptExecution }) {
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null); // Track the selected route
    const [triggerFetch, setTriggerFetch] = useState(false); // Trigger fetches

    const executeScript = async () => {
        try {
            if (!selectedOption) return; // Ensure an option is selected

            setLoading(true);
            console.log('Making a post request with target route', selectedOption);

            const runScriptResponse = await axios({
                method: 'post',
                url: 'http://localhost:5000/run-script',
                data: {
                    target_route: selectedOption.route_id,
                },
            });

            console.log('Response status:', runScriptResponse.status);
            onScriptExecution(runScriptResponse.status === 200);
            setLoading(false);
        } catch (error) {
            console.error('Error running the script or getting the CSV files:', error.response);
            setLoading(false);
        }
    };

    // useEffect to handle script execution on triggerFetch
    useEffect(() => {
        if (triggerFetch) {
            executeScript();
            setTriggerFetch(false); // Reset trigger to prevent infinite loop
        }
    }, [triggerFetch]); // Re-run when triggerFetch changes

    // Handle route selection change
    const handleRouteChange = (option) => {
        setSelectedOption(option); // Update the selected route
        setTriggerFetch(true); // Trigger script execution
    };

    return (
        <div>
            <h4>{loading ? 'Loading...' : 'Fetch CSV Data'}</h4>
            <RouteSelectComponent onChange={handleRouteChange} />
        </div>
    );
}

export default RunScriptComponent;
