import React, { useState } from 'react'
import axios from 'axios'
import Papa from 'papaparse'
import SelectComponent from './SelectComponent';

function RunNotebook({ onCsvUpdate }) {
    const [loading, setLoading] = useState(false);

    const fetchCsv = async (selectedOption) => {
        try {
            
            setLoading(true);
            console.log("Making a post request with target route ", selectedOption)
            const response = await axios({
                method: 'post',
                url: 'http://localhost:5000/run-script',
                data: {
                  target_route: selectedOption.route_id
                }
            });

            console.log("response is: \n" + response.data)
            
            try {
                Papa.parse(response.data, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (response) => {
                        // Update App's state via callback
                        if (onCsvUpdate) {
                            onCsvUpdate(response.data);
                        }
                    },
                });
            } catch (error) {
                console.error("Error parsing the CSV file:", error);
            } finally {
                setLoading(false);
            }

        } catch (error) {
            console.error('Error fetching the CSV:', error.response);
            setLoading(false);
        }
    };

    return (
        <div>
            <h4>{loading ? 'Loading...' : 'Fetch CSV Data'}</h4> 
            <SelectComponent onChange = {fetchCsv} />
        </div>
    );
}

export default RunNotebook;
