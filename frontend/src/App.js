import React, { useEffect, useState } from 'react'
import RunScriptComponent from './components/RunScript';
import DisplayMapComponent from './components/DisplayMap';
import './App.css'
import GetOtpAnalysisResultComponent from './components/GetOtpAnalysis';

function App() {
    console.log("gtfs-react-app started!")

    // State to store data passed from RunNotebook
    const [analysisDataReceived, setAnalysisDataReceived] = useState(false);
    const [otpAnalysisData, setOtpAnalysisData] = useState([]);
    const [directionOneCsvData, setDirectionOneCsvData] = useState([]);
    const [directionTwoCsvData, setDirectionTwoCsvData] = useState([]);

    // Callback to update the selected route in App
    const handleScriptExecutionStatus = (status) => {
        setAnalysisDataReceived(status);
        if (status) {
            // Reset states when script is executed again
            setOtpAnalysisData([]);
            setDirectionOneCsvData([]);
            setDirectionTwoCsvData([]);
        }
    };

    const handleOtpCsvData = (csvData) => {
        setOtpAnalysisData(csvData)
    }

    const handleDirectionOneCsvData = (csvData) => {
        setDirectionOneCsvData(csvData)
    }

    const handleDirectionTwoCsvData = (csvData) => {
        setDirectionTwoCsvData(csvData)
    }

    // useEffect(() => {
    //     if (analysisDataReceived && !otpAnalysisData) {
    //         console.log('Triggering first CSV fetch');
    //     }
    // }, [analysisDataReceived, otpAnalysisData]);
    
    // useEffect(() => {
    //     if (otpAnalysisData && !directionOneCsvData) {
    //         console.log('Triggering second CSV fetch');
    //     }
    // }, [otpAnalysisData, directionOneCsvData]);
    
    // useEffect(() => {
    //     if (directionOneCsvData && !directionTwoCsvData) {
    //         console.log('Triggering third CSV fetch');
    //     }
    // }, [directionOneCsvData, directionTwoCsvData]);

    return (
        <>
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1>GTFS-rt Bus Report Card</h1>
            <h2>Select Bus Route</h2>
            <RunScriptComponent onScriptExecution={handleScriptExecutionStatus} />
            {analysisDataReceived && otpAnalysisData.length === 0 && (
                <GetOtpAnalysisResultComponent
                    csv='get-otp-analysis'
                    triggerFetch={true}
                    onCsvUpdate={handleOtpCsvData}
                />
            )}
            {otpAnalysisData && directionOneCsvData.length === 0 && (
                <GetOtpAnalysisResultComponent
                    csv='get-first-direction-buses'
                    triggerFetch={true}
                    onCsvUpdate={handleDirectionOneCsvData}
                />
            )}
            {directionOneCsvData && directionTwoCsvData.length === 0 && (
                <GetOtpAnalysisResultComponent
                    csv='get-second-direction-buses'
                    triggerFetch={true}
                    onCsvUpdate={handleDirectionTwoCsvData}
                />
            )}
            <h2>On Time Performance</h2>
            {otpAnalysisData.length > 0 ? (
                <table
                    style={{
                        borderCollapse: 'collapse',
                        height: '80vh',
                        width: '80%',
                        margin: 'auto',
                        borderRadius: '2rem',
                    }}
                >
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                        {Object.keys(otpAnalysisData[0]).map((key) => (
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
                    {otpAnalysisData.map((row, index) => (
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
            <p>No data to display. Click the button to fetch CSV data.</p>
            )}
            <h3>Methodology</h3>
            <p>
            The method used to evaluate On Time Performance involves examining all the static and 
            realtime trips of a given route, and comparing the realtime locations (stops) with the 
            expected scheduled locations (stops).
            </p>
            <h2>Bus Bunching</h2>
            {directionOneCsvData && directionTwoCsvData && (
                <DisplayMapComponent triggerFetch={true} directionOneCsv={directionOneCsvData} directionTwoCsv={directionTwoCsvData}/>                
            )}
            <h3>Methodology</h3>
            <p>Coming soon</p>
            <h2>Service Guarantee</h2>
            <h3>Methodology</h3>
            <p>Coming soon</p>
            <h2>Vehicle Capacity</h2>
            <h3>Methodology</h3>
            <p>Coming soon</p>
        </div>
        </>

    );

}

export default App;
