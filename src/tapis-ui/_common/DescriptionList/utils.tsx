import React from "react";

// Helper function to determine if a value is an object
const isObject = (val: object) =>
  typeof val === "object" && val !== null && !Array.isArray(val);

// Recursively format data for display
export const parseParameterSet = (data: any) => {
  if (Array.isArray(data)) {
    // Use a table for arrays of objects for better structure
    if (data.every(isObject)) {
      return (
        <table>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {Object.entries(item).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <td>
                      <strong>{key}</strong>
                    </td>
                    <td>{parseParameterSet(value)}</td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return (
        <ul>
          {data.map((item, index) => (
            <li key={index}>{parseParameterSet(item)}</li>
          ))}
        </ul>
      );
    }
  } else if (isObject(data)) {
    return (
      <table>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <td>
                <strong>{key}</strong>
              </td>
              <td>{parseParameterSet(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    return <>{JSON.stringify(data)}</>; // Simple data types are just stringified
  }
};
