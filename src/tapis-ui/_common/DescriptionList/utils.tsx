import React from "react";
import { Collapse } from "tapis-ui/_common";

type Item = {
  name?: string;
  description?: string;
  arg?: string;
  include?: boolean;
  key?: string;
  value?: string;
};

const paramSection = (
  val: Item[] | { [key: string]: any }
): React.ReactNode => {
  //   Handle array of objects: envVariables, containerArgs, schedulerOptions
  if (Array.isArray(val)) {
    return val
      .map((item: Item, idx: number) => {
        if (item.key && item.value) {
          return (
            <React.Fragment key={idx}>
              <dt>{item.key}</dt>
              <dd>{item.value}</dd>
            </React.Fragment>
          );
        }
        console.log("Item is not a dict", item);
        return null;
      })
      .filter((element) => element !== null);
    //   Handle objects: logConfig, archiveFilter
  } else if (typeof val === "object") {
    return Object.entries(val).map(([subKey, subVal], idx) => (
      <React.Fragment key={idx}>
        <dt>{subKey}</dt>
        <dd>{String(subVal)}</dd>
      </React.Fragment>
    ));
  }
  return null;
};

const displayParameterSet = (value: string) => {
  try {
    const parameterSet = JSON.parse(value) as { [key: string]: any };
    const { appArgs, ...otherParams } = parameterSet;
    // Render appArgs as a simple table
    return (
      <div>
        <Collapse
          title="Application Arguments"
          open={true}
          note={`${appArgs.length} Arguments`}
        >
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Argument</th>
                <th>Include</th>
              </tr>
            </thead>
            <tbody>
              {appArgs.map((arg: Item) => (
                <tr key={arg.name}>
                  <td>{arg.name}</td>
                  <td>{arg.description}</td>
                  <td>{arg.arg}</td>
                  <td>{String(arg.include)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Collapse>
        <div>
          {Object.entries(otherParams).map(([key, val], index) => (
            <Collapse
              key={index}
              title={key}
              note={`${
                Array.isArray(val) ? val.length : Object.keys(val || {}).length
              } Parameters`}
            >
              <dl>{paramSection(val)}</dl>
            </Collapse>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    return <p>Error parsing parameterSet: {e.message}</p>;
  }
};

export default displayParameterSet;
