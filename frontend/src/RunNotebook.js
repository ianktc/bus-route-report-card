import React, { useState } from 'react'
import axios from 'axios'
import Papa from 'papaparse'
import SelectComponent from './SelectComponent';

function RunNotebook() {
    const [csvData, setCsvData] = useState([]);
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
                        setCsvData(response.data);
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
            {csvData.length > 0 ? (
                <table
                    style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        marginTop: '20px',
                    }}
                >
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                        {Object.keys(csvData[0]).map((key) => (
                            <th
                                key={key}
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                }}
                            >
                                {key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {csvData.map((row, index) => (
                        <tr
                            key={index}
                            style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                                backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                            }}
                        >
                            {Object.values(row).map((value, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        border: '1px solid #ddd',
                                        padding: '8px',
                                    }}
                                >
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                </table>
            ) : (
                !loading && <p>No data to display. Click the button to fetch CSV data.</p>
            )}
        </div>
    );
}

export default RunNotebook;
