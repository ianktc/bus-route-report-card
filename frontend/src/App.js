import React from "react";
import RunNotebook from "./RunNotebook"

function App() {
  console.log("gtfs-react-app started!")
  return (
    <>
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1>GTFS-rt Bus Report Card</h1>
        <h2>Select Bus Route</h2>
        <RunNotebook/>
      </div>
    </>

  );
}

export default App;
