import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "tapis-ui/_common";
import styles from "./Navbar.module.scss";

// Helper function to determine if a link is external
const isExternal = (url: string) => /^(http|https):\/\//.test(url);

export const NavItem: React.FC<{
  to: string;
  icon?: string;
}> = ({ to, icon, children }) => {
  // Render a regular <a> tag for external links
  if (isExternal(to)) {
    return (
        <a
            href={to}
            target="_blank"
            rel="noopener noreferrer"
            className={styles["nav-link"]}
        >
          <div className={styles["nav-content"]}>
            {icon && <Icon name={icon} />}
            <span className={styles["nav-text"]}>{children}</span>
          </div>
        </a>
    );
  }

  // Use NavLink for internal navigation
  return (
      <NavLink
          to={to}
          className={styles["nav-link"]}
          activeClassName={styles["active"]}
          exact={to === "/"}
      >
        <div className={styles["nav-content"]}>
          {icon && <Icon name={icon} />}
          <span className={styles["nav-text"]}>{children}</span>
        </div>
      </NavLink>
  );
};

const Navbar: React.FC = ({ children }) => {
  return <div className={styles["nav-list"]}>{children}</div>;
};

export default Navbar;
