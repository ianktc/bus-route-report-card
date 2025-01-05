import React, { useState } from 'react'
import RunScriptComponent from './components/RunScript';
import DisplayMapComponent from './components/DisplayMap';
import './App.css'
import GetOtpAnalysisResultComponent from './components/GetOtpAnalysis';

import behind1 from './assets/behind1.png';
import behind2 from './assets/behind2.png';
import on1 from './assets/on1.png';
import on2 from './assets/on2.png';
import onException from './assets/onException.png';
import ahead1 from './assets/ahead1.png';
import ahead2 from './assets/ahead2.png';
import spadina from './assets/501Spadina.png';
import bunching1 from './assets/bunching1.png';
import bunching2 from './assets/bunching2.png';
import bunching3 from './assets/bunching3.png';
import bunching4 from './assets/bunching4.png';

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
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', lineHeight: '1.5em', marginLeft: '3em', marginRight: '3em'}}>
            <h1>GTFS-rt Bus Report Card</h1>
            <h2>Select Bus Route</h2>
            <h3>Some suggested routes</h3>
            <ul>
                <li>510 Spadina</li>
                <li>21 Brimley</li>
                <li>501 Queen</li>
                <li>504 King</li>
                <li>96 Wilson</li>
            </ul>
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
            <h2>Motivation</h2>
            <p>Transit routes in Toronto, particularly bus and streetcar routes, are commonly scorned for their performance (or maybe lack thereof).
                Riders often experience poor schedule adherence, 'ghost buses' that do not show up, or 'bus bunching' when 3 or 4 subsequently 
                arrive late in quick succession. They may experience service disruptions when scheduled trips are cancelled with no viable alternatives.
                Or if they are able to board a vehicle, they may be uncomortably packed in with too many other passengers. For these reasons, riders 
                often turn to the subway, walking, cycling, or even rideshare services for a more reliable or comfortable transportation mode. In 
                this analysis, I aim to examine a few simple metrics that measure the effectiveness of TTC bus and streetcar routes. I hope that these 
                observations can be used by riders and policymakers alike to study the strengths and shortcomings of transit routes in Toronto. 
                <br/><br/>The four chosen metrics are:
            </p>
            <ol>
                <li><em>On Time Performance: </em> Whether the vehicles for a given route are
                    on time, behind, or ahead of schedule in a particular instant of time.    
                </li>
                <li><em>Bus Bunching: </em>Whether the vehicles for a given route travel too closely together in a particular instant of time</li>
                <li><em>Service Guarantee: </em>Whether the agency delivers on its scheduled trips for a given route</li>
                <li><em>Vehicle Occupancy: </em>Whether the vehicles for a given rotue are transporting a reasonable
                number of passengers</li>
            </ol>  
            <h2>Terminology and Usage</h2>
            <p><strong>"Static trips" and "Scheduled trips"</strong> may be used interchangeably. These refer to the trips that 
                are scheduled by the agency and are represented by trip_id in the trips.txt GTFS file. 
                The main GTFS files used were: routes, trips, stops and stop_times. The static GTFS feed was retrieved from 
                <a href='https://mobilitydatabase.org/feeds?gtfs=true'> MobilityData</a> and is accurate as of January 1st 2025.
            </p>
            <p><strong>"Realtime trips"</strong>" refer to all the trips that are running for a particular route at a particular time.
                These realtime trips are parsed from a protobuf feed at <a href='https://bustime.ttc.ca/gtfsrt/vehicles?debug'>
                https://bustime.ttc.ca/gtfsrt/vehicles?debug</a>. Each realtime entity contains a trip_id which corresponds 
                to a trip_id in the trips.txt GTFS file. Those trip_ids that do not correspond to a trip_id in the file are known 
                as ADDED trips (in other words UNSCHEDULED trips). In the protobuf feed these trip_ids are negative integers.
            </p>
            <p><strong>The static GTFS Reference</strong> can be found at <a href='https://gtfs.org/documentation/schedule/reference/'>https://gtfs.org/documentation/schedule/reference/ </a>
                and <strong>the GTFS-rt Reference</strong> can be found at <a href='https://gtfs.org/documentation/realtime/reference/'> https://gtfs.org/documentation/realtime/reference/</a> 
            </p>
            <p>As far as I have found, the TTC currently does not support GTFS-rt Vehicle Locations for subways. This may be due 
                to unavailability of GPS data from underground trains. As a result, the scope of this is limited to only bus and 
                streetcar routes for the TTC. This could be subject to future change if GTFS-rt Vehicle Location data becomes
                available.
            </p>
            <p><strong>Usage:</strong></p>
            <ol>
                <li>Click on the selector under Select Bus Route</li>
                <li>Type in the desired bus/streetcar route by name or short name (eg. '510' or 'Spadina')</li>
                <li>Click on the option as it appears under the selector</li>
                <li>Allow the script to run and serve the results back to the app (may take 4-5 seconds)</li>
                <li>Results will be visible under the four respective evaluation categories</li>
            </ol>  
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
            <p>No data to display. Use the route selector to select a route.</p>
            )}
            <h3>Exposition and Methodology</h3>
            <p>The method used to evaluate On Time Performance involves examining all the static and 
                realtime trips of a given route, and comparing the realtime locations (nearest stop) with the 
                expected scheduled locations (nearest stop). <br/><br/> In the instant that a route is selected in the 
                route selector, all the static trips for that route that should be running in that instant (+ 1 minute) 
                are retrieved from the static trips.txt file. These static trips will contain the next stop that each vehicle 
                <em> should</em> be on-route towards. The realtime locations of the vehicles for the provided route are 
                then compared with the expected stop locations from the static trips. 
                <br/><br/>&emsp;&emsp;If <em>static stop_sequence == realtime stop_sequence </em>then the trip is deemed to be on-schedule. 
                <br/>&emsp;&emsp;If <em>static stop_sequence &lt; realtime stop_sequence </em>then the trip is deemed to be ahead of schedule. 
                <br/>&emsp;&emsp;If <em>static stop_sequence &gt; realtime stop_sequence </em>then the trip is deemed to be behind schedule. 
            </p>
            <h3>Implementation</h3>
            <p>The comparison of each realtime vehicle's location to every stop's location is a costly process, and has
                time complexity of O(n*m). I used a k-dimensional tree to speed up the query time complexity. Because the location 
                of every stop in a given route does not change, I inserted all the stop locations into a kd tree and 
                made a query for each vehicle's location to find the nearest stop. This query has an overall better time
                complexity of O(n*log(m)). <br/><br/>Previously without a kd tree, a shortcoming of this approach was faulty on-time predictions.
                In the two cases where the realtime vehicle location is ahead or behind schedule, this shortcoming does 
                not have a major effect. If the vehicle is ahead of schedule, we do not differentiate between whether the
                vehicle is approaching the next stop or already past it. Similarly if the vehicle is behind schedule, we
                are not concerned whether the vehicle has already reached the previous stop, or is still approaching it. 
                <br/><br/>In both scenarios, the vehicle is still accurately predicted to be either behind or ahead of schedule. 
                These scenarios are displayed here, where n is the scheduled expected stop_sequence.
            </p>
            <div style={{textAlign:'center'}}>
                <img style={{width: '600px'}} src={behind1} alt=''/>
                <img style={{width: '600px'}} src={behind2} alt=''/>
                <img style={{width: '600px'}} src={ahead1} alt=''/>
                <img style={{width: '600px'}} src={ahead2} alt=''/>
            </div>
            <p>However in the case that the prediction is on-time, we could still differentiate between whether the vehicle 
                is approaching the stop or already past it. Rarely are vehicles exactly at the stop location!
            </p>
            <div style={{textAlign:'center'}}>
                <img style={{width: '600px'}} src={on1} alt=''/>
                <img style={{width: '600px'}} src={on2} alt=''/>
            </div>
            <p>Using a kd tree we are therefore able to maintain a max heap of the n nearest neighbours (in this case 2 closest stops).
                In doing this we could in theory determine whether the vehicle is approaching the stop (nearest stops of n and n-1) 
                or already past the stop (nearest stops of n and n+1). Unfortunately stops on a route are not equally spaced apart,
                and because a vehicle is nearest to stop n and n+1, this does not necessarily mean its already past stop n:
            </p>
            <div style={{textAlign:'center'}}>
                <img style={{width: '600px'}} src={onException} alt=''/>
            </div>
            <p>And so a compromise was made: the on time prediction is now only made based on the nearest 1 stop.
            </p>
            <h3>Observations and Further Exploration</h3>
            <p>Upon making the analysis several times with different routes and at different times of the day, I have consistently
                observed vehicles to be ahead or behind schedule. For a particular given route (eg. 510 Spadina) 25% are typically 
                perfectly on-time, while the remaining 75% are either ahead or behind schedule. Of these vehicles that are ahead or 
                behind schedule, some of them are 'only' 1 or 2 stops off of the expected stop. This aligns with the apocryphal 
                '3 minutes on either side' guarantee of service. This considers vehicles that arrive either 3 minutes early or late
                to be 'on time'. Although I have found no indication from the TTC that this (or any other window) is guaranteed, if 
                we adjust for this buffer then a near majority ~50% of vehicles running on most routes could be considered on time.  
                <br/><br/>Further exploration on this metric could be conducted by leveraging the historical context provided by 
                this realtime data. For instance, the performance of the vehicles on a particular route could be stored over a period
                of time (such as one year). Using the data collected over the course of this year, we could perform a frequency
                analysis to determine if vehicles at certain stops on a route are consistently ahead or behind schedule. Interesting questions
                can be drawn from this data such as: the traffic patterns in that segment of the route, or the absence of passengers 
                to pick up (if the vehicle is consistently passing the stop without stopping) to name a few.
            </p>
            <h2>Bus Bunching</h2>
            {directionOneCsvData && directionTwoCsvData && (
                <DisplayMapComponent triggerFetch={true} directionOneCsv={directionOneCsvData} directionTwoCsv={directionTwoCsvData}/>                
            )}
            <h3>Exposition and Methodology</h3>
            <p>The method used to evaluate Bus Bunching involves examining all the realtime trips of a given route and identifying
                the vehicles that are travelling 'too closely' together. However, I had to answer one major question before addressing
                this problem:<br/><br/><em>What is the threshold where two buses become 'bunched'?</em><br/><br/>In addition to this,
                I also needed to decide how to measure the bunching between two vehicles, namely either the time or distance between them.
                Because the realtime vehicle data contained the latitude/longitude pairs for each vehicle, I decided to use distance as 
                the unit of measurement. Besides, when riders observe bunching between buses or streetcars, it is often the close distance
                between them that is most irritating! To decide the bunching threshold, I first imagined the ideal scenario where all 
                buses on a route are regularly spaced. If there are enough vehicles, this would mean that there would be one bus for every 
                stop on the route. Of course, this is rarely the case, and also rarely necessary, but this would imply that ideally the 
                buses on a route should be travelling at a distance no lesser than the average distance between two stops. For this reason, 
                I decided to make the bunching threshold the average separation distance between the stops of a route.
            </p>
            <div class='container'>
                <img src={spadina} alt=''/>
                <div class='nested-container'>
                    <p>In the figure on the left (Spadina Route 510), we can observe the equal spacing of hypothetical vehicles (green) compared to the 
                        spacing of stops (red). In this instance, the relatively equal spacing of stops means that there are no outliers. However if 
                        there is an unequal spacing between stops of a route, this may result in buses to appear bunched between those stops 
                        with an abnormally large separation distance:  
                    </p>
                    <img src={bunching1} alt=''/>
                    <img src={bunching2} alt=''/>
                    <p>Furthermore, this approach would not work if there were also more buses on a route than there are stops. This would likely
                        not occur because it could be assumed that the TTC would not field more buses than stops for any given direction of a 
                        route. Nontheless, in this exceptional case, the increased frequency would be incorrectly flagged as bus bunching:
                    </p>
                    <img src={bunching3} alt=''/>
                </div>
  
            </div>
            <h3>Implementation</h3>
            <p>The bunching threshold was defined as the average stop separation distance. This value was calculated by iterating over all the 
                stops on a route, summing the separation distances and dividing by the number of stops. Once the bunching threshold was found, 
                it was used to compare all possible vehicle pairs to decide if they were bunched.<br/><br/>
                Similar to the On Time Performance analysis, a kd tree was used to find bunched vehicle pairs. However instead of making a nearest 
                neighbour (stop) query, a range query was made. Let <em>d</em> represent the bunching threshold distance.
                <ol>
                    <li>All vehicle locations are inserted into the tree</li>
                    <li>Iterate through each vehicle location V<sub>x</sub> to find all (V<sub>y</sub>) vehicles that are bunched with 
                        it, where (V<sub>y</sub>, V<sub>y</sub>) is a pair of bunched vehicles
                    </li> 
                    <li>For each V<sub>x</sub>, recurse through the tree and at each node V<sub>y</sub>, calculate the euclidean distance between 
                    V<sub>x</sub> and V<sub>y</sub> </li>
                    &emsp;&emsp;If the node V<sub>y</sub> is within distance <em>d</em> of V<sub>x</sub> then recurse down both subtrees of the node
                    <br/>&emsp;&emsp;Else only recurse down the subtree which V<sub>x</sub> belongs to
                </ol>
            </p>
            <p>Unlike the nearest neighbour query, the range query time complexity is O(&radic;n + m). The dimension split of the kd tree allows us 
                to examine n<sup>1/2</sup> (half) of the locations while the m represents the locations that fall within the range <em>d</em>.
            </p>
            <h3>Observations and Further Exploration</h3>
            <p>This analysis has frequently revealed vehicles to bunch at the terminal stops/stations. In the case of the 510 Spadina, the 
                terminal stations of Spadina-Bloor and Exhibition Place are typical locations where buses tend to congregate. This is 
                possibly due to the nature of terminal stations, where passengers may be slow to disembark or board, or perhaps when 
                bus operators change shifts or take breaks. Due to the strict nature of a terminal station (vehicles must stop there 
                to facilitate transfers), this also leads to a back-up where buses are not able to bypass the station and continue the route. 
                This is actually a strategy bus operators might use to pass buses that already arrived at a stop (provided no passengers 
                request to get off at that stop). Unfortunately, this sort of bus bunching at terminal stations can only be addressed through
                optimization of station transfers, station layouts, crowd control, or any number of other solutions...
                <br/><br/>On the other hand, bus bunching that occurs at non-terminal stops may offer insight into traffic conditions near those
                bunched buses, or perhaps it may suggest that changes need to be made in stop configurations. For instance, if buses of a route 
                are consistently bunching near stop <em>n</em>, this may imply a heavy demand in this location, and potentially support the 
                case for adding a new stop <em>m</em> near it.   
            </p>
            <div style={{textAlign:'center'}}>
                <img style={{width: '600px'}} src={bunching4} alt=''/>
            </div>
            <h2>Service Guarantee</h2>
            <h3>Exposition and Methodology</h3>
            <p>The method used to evaluate service guarantee was simply comparing the number of static trips to the number of realtime trips for a
                route. 

            </p>
            <h3>Implementation</h3>
            <h3>Observations and Further Exploration</h3>
            <p>Coming soon</p>
            <h2>Vehicle Capacity</h2>
            <h3>Exposition and Methodology</h3>
            <h3>Implementation</h3>
            <h3>Observations and Further Exploration</h3>
            <p>Coming soon</p>
        </div>
        </>

    );

}

export default App;
