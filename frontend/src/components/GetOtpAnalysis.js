import { useEffect } from 'react';
import axios from 'axios'
import Papa from 'papaparse'

function GetOtpAnalysisResultComponent({ csv, triggerFetch, onCsvUpdate }) {

    const fetchCsv = async () => {
        try {
            
            console.log("Trying to get the otp analysis result")
            const response = await axios({
                method: 'get',
                url: 'http://localhost:5000/' + csv,
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
                console.error("Error parsing the analysis csv file:", error);
            } finally {

            }

        } catch (error) {
            console.error('Error fetching the analysis csv file:', error.response);
        }
    };

    // Trigger fetchCsv whenever `triggerFetch` changes to `true`
    useEffect(() => {
        if (triggerFetch) {
            fetchCsv();
        }
    },[fetchCsv]);

}

export default GetOtpAnalysisResultComponent;
