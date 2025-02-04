import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import axios from 'axios'
import Papa from 'papaparse'

function SelectRouteComponent({ onChange }){
    const [busRoutesGotten, getBusRoutes] = useState(false)
    const [busRoutes, setBusRoutes] = useState([]);

    // useEffect hook with the empty dependency arr [] will only trigger when the component mounts!
    useEffect (() => {
        async function getRoutes() {
            try {
                
                console.log("Making a get request")
                const response = await axios({
                    method: 'get',
                    url: 'http://localhost:5000/get-routes',
                });
                getBusRoutes(true)
                console.log("response is: \n" + response.data)
                
                try {
                    Papa.parse(response.data, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (response) => {
                            setBusRoutes(response.data);
                        },
                    });
                } catch (error) {
                    console.error("Error parsing the routes csv file:", error);
                } finally {

                }

            } catch (error) {
                console.error('Error fetching the csv file:', error.response);
            }
        }

        // if not gotten yet, get bus routes
        if (!busRoutesGotten) {
            getRoutes();
        }
    }, [])

    const loadOptions = (searchValue, callback) => {
        setTimeout(() => {
            const filteredOptions = busRoutes.filter((busRoute) => 
                (busRoute.route_id + busRoute.route_long_name).toLowerCase().includes(searchValue.toLowerCase())
            );
            console.log('loadOptions equals ', searchValue, filteredOptions)
            callback(filteredOptions)
        }, 3000)
    }

    return <AsyncSelect 
        loadOptions = {loadOptions} 
        onChange = {onChange} 
        getOptionLabel = {(option) => (option.route_id + ' - ' + option.route_long_name)}
        getOptionValue = {(option) => option.route_id}    
    />
}

export default SelectRouteComponent;