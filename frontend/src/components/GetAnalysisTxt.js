import { useEffect } from 'react';
import axios from 'axios'

function GetTxtResultComponent({ txt, triggerFetch, onCsvUpdate }) {

    const fetchCsv = async () => {
        try {
            
            console.log("Trying to get the analysis result")
            const response = await axios({
                method: 'get',
                url: 'http://localhost:5000/' + txt,
            });

            console.log("response is: \n" + response.data)
            
            // Split the data by new lines
            const parsedData = response.data.split('\n').filter(line => line.trim() !== '');
            console.log(parsedData)

            // Update App's state via callback
            if (onCsvUpdate) {
                onCsvUpdate(parsedData);
            }

        } catch (error) {
            console.error('Error fetching the analysis txt file:', error.response);
        }
    };

    // Trigger fetchCsv whenever `triggerFetch` changes to `true`
    useEffect(() => {
        if (triggerFetch) {
            fetchCsv();
        }
    },[fetchCsv]);

}

export default GetTxtResultComponent;
