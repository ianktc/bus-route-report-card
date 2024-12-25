import React, { useState } from "react";
import Papa from "papaparse";

const CSVReader = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
        },
      });
    }
  };

  return (
    <div>
      <h1>CSV Data Viewer</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {fileName && <p>Showing data from: {fileName}</p>}
      {data.length > 0 && (
        <table border="1" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, idx) => (
                  <td key={idx}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CSVReader;
