import React, { useState } from "react";
import styles from "./Sidebar.module.scss";
import { Navbar, NavItem } from "tapis-ui/_wrappers/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

interface SidebarProps {
  collapsed?: boolean; // Define the type for toggleCollapsed prop
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const width = collapsed ? '4.2rem' : '215px';
  return (
    <div className={styles.root} style={{ minWidth: width, width: width, maxWidth: width }}>
      <Navbar>
        {collapsed ? (
          <>
            <NavItem to="/" icon="dashboard" />
            <NavItem to="/apps" icon="applications" />
            <NavItem to="/files" icon="data-files" />
            <NavItem to="/jobs" icon="jobs" />
            <NavItem to="https://docs.google.com/presentation/d/1UB3VrQXAiCqAJEa0hDQmgmr9TWBlHxPmuo-gtoiRod4/edit#slide=id.g35f391192_00" icon="compass" />
            <NavItem to="mailto:uh-hpc-help@lists.hawaii.edu" icon="conversation" />
          </>
        ) : (
          <>
            <NavItem to="/" icon="dashboard">
              <div className={styles["navitem-text"]}>Dashboard</div>
            </NavItem>
            {/*<NavItem to="/systems" icon="data-files">*/}
            {/*  Systems*/}
            {/*</NavItem>*/}
            <NavItem to="/apps" icon="applications">
              <div className={styles["navitem-text"]}>Apps</div>
            </NavItem>
            <NavItem to="/files" icon="data-files">
              <div className={styles["navitem-text"]}>Data</div>
            </NavItem>
            <NavItem to="/jobs" icon="jobs">
              <div className={styles["navitem-text"]}>Jobs</div>
            </NavItem>
            <NavItem to="https://docs.google.com/presentation/d/1UB3VrQXAiCqAJEa0hDQmgmr9TWBlHxPmuo-gtoiRod4/edit#slide=id.g35f391192_00" icon="compass">
              <div className={styles["navitem-text"]}>Walkthrough</div>
            </NavItem>
            <NavItem to="mailto:uh-hpc-help@lists.hawaii.edu" icon="conversation">
              <div className={styles["navitem-text"]}>Help</div>
            </NavItem>
            {/*<NavItem to="/workflows" icon="publications">*/}
            {/*  Workflows*/}
            {/*</NavItem>*/}
          </>
        )}
      </Navbar>
    </div>
  );
};

export default Sidebar;
