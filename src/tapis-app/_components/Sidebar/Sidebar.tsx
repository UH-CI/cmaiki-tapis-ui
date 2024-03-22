import React, { useState } from "react";
import styles from "./Sidebar.module.scss";
import { Navbar, NavItem } from "tapis-ui/_wrappers/Navbar";

const Sidebar: React.FC = () => {
  const [collapsed] = useState(false);
  return !collapsed ? (
    <div className={styles.root}>
      <Navbar>
        <NavItem to="/" icon="dashboard">
          Dashboard
        </NavItem>
        {/*<NavItem to="/systems" icon="data-files">*/}
        {/*  Systems*/}
        {/*</NavItem>*/}
        <NavItem to="/apps" icon="applications">
          Apps
        </NavItem>
        <NavItem to="/files" icon="data-files">
          Data
        </NavItem>
        <NavItem to="/jobs" icon="jobs">
          Jobs
        </NavItem>
        <NavItem
          to="https://docs.google.com/presentation/d/1UB3VrQXAiCqAJEa0hDQmgmr9TWBlHxPmuo-gtoiRod4/edit#slide=id.g35f391192_00"
          icon="compass"
        >
          Walkthrough
        </NavItem>
        <NavItem to="mailto:uh-hpc-help@lists.hawaii.edu" icon="conversation">
          Help
        </NavItem>
        {/*<NavItem to="/workflows" icon="publications">*/}
        {/*  Workflows*/}
        {/*</NavItem>*/}
      </Navbar>
    </div>
  ) : (
    <></>
  );
};

export default Sidebar;
