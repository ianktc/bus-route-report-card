import { useEffect } from 'react';
import axios from 'axios'
import Papa from 'papaparse'

function GetAnalysisResultComponent({ onCsvUpdate }) {

    const fetchCsv = async () => {
        try {
            
            console.log("Trying to get the otp analysis result")
            const response = await axios({
                method: 'get',
                url: 'http://localhost:5000/get-otp-analysis',
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
                console.error("Error parsing the otp analysis csv file:", error);
            } finally {
                // setLoading(false);
            }

        } catch (error) {
            console.error('Error fetching the otp analysis csv file:', error.response);
            // setLoading(false);
        }
    };

    // Trigger fetchCsv whenever `triggerFetch` changes to `true`
    useEffect(() => {
        // if (triggerFetch) {
            fetchCsv();
        // }
    },[]);

}

export default GetAnalysisResultComponent;
