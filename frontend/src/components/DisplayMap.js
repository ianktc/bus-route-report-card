import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import '../App.css'

// import { Icon, divIcon, point } from "leaflet";

function DisplayMapComponent({triggerFetch, directionOneCsv, directionTwoCsv}){

    const [directionOneMarkers, setD1Markers] = useState([]);
    const [directionTwoMarkers, setD2Markers] = useState([]);

    const svgIconRed = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
        <path fill="#c01c28" d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32c0 0 0 0 0 0l0-32s0 0 0 0l0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l112 0 0-160-112 0c-17.7 0-32 14.3-32 32zM304 288l112 0c17.7 0 32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-112 0 0 160zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
        </svg>`;

    const svgIconBlue = `
        <svg 
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#1c71d8" d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32c0 0 0 0 0 0l0-32s0 0 0 0l0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l112 0 0-160-112 0c-17.7 0-32 14.3-32 32zM304 288l112 0c17.7 0 32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-112 0 0 160zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
        </svg>`;

    // Encode the SVG to a data URL
    const svgRedUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIconRed)}`;
    const svgBlueUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIconBlue)}`;


    // create custom icon
    const customIconRed = new Icon({
        iconUrl: svgRedUrl,
        iconSize: [20, 20] // size of the icon
    });

    const customIconBlue = new Icon({
        iconUrl: svgBlueUrl,
        iconSize: [20, 20] // size of the icon
    });
    
    // // custom cluster icon
    // const createClusterCustomIcon = function (cluster) {
    //     return new divIcon({
    //     html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    //     className: "custom-marker-cluster",
    //     iconSize: point(33, 33, true)
    //     });
    // };

    useEffect(() => {
        if (triggerFetch && directionOneCsv && directionTwoCsv) {
            const directionOneCoords = directionOneCsv.map((row) => ({
                geocode: [parseFloat(row.vehicle_latitude), parseFloat(row.vehicle_longitude)],
                popUp: `Direction 1 - Lat: ${row.vehicle_latitude}, Lon: ${row.vehicle_longitude}`,
            }));

            // Create markers for directionTwoCsv
            const directionTwoCoords = directionTwoCsv.map((row) => ({
                geocode: [parseFloat(row.vehicle_latitude), parseFloat(row.vehicle_longitude)],
                popUp: `Direction 2 - Lat: ${row.vehicle_latitude}, Lon: ${row.vehicle_longitude}`,
            }));

            // Combine and set markers
            setD1Markers([...directionOneCoords]);
            setD2Markers([...directionTwoCoords]);
        }
    }, [triggerFetch, directionOneCsv, directionTwoCsv]);

    return (
        // center in Toronto
        <MapContainer center={[43.666702, -79.399977]} zoom={13}>
            {/* OPEN STREEN MAPS TILES */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* WATERCOLOR CUSTOM TILES */}
            {/* <TileLayer
                attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg"
            /> */}
            {/* GOOGLE MAPS TILES */}
            {/* <TileLayer
                attribution="Google Maps"
                url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" // regular
                // url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" // satellite
                // url="http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}" // terrain
                maxZoom={20}
                subdomains={["mt0", "mt1", "mt2", "mt3"]}
            /> */}

            {directionOneMarkers.map((marker) => (
                <Marker position={marker.geocode} icon={customIconRed}>
                    <Popup>{marker.popUp}</Popup>
                </Marker>
            ))}
            {directionTwoMarkers.map((marker) => (
                <Marker position={marker.geocode} icon={customIconBlue}>
                    <Popup>{marker.popUp}</Popup>
                </Marker>
            ))}
        </MapContainer>
      );

}

export default DisplayMapComponent;