import React from "react";
import styles from "./PageLayout.module.scss";

interface LayoutProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  constrain?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  left,
  right,
  center,
  top,
  bottom,
  constrain,
}) => (
  <div
    className={`${styles["layout-root"]} ${constrain ? styles.constrain : ""}`}
  >
    {top}
    {/* Check for center content first */}
    {center ? (
      <div
        className={`${styles["layout-row"]} ${styles.center} ${
          constrain ? styles.constrain : ""
        }`}
      >
        {center}
      </div>
    ) : (
      <div
        className={`${styles["layout-row"]} ${
          constrain ? styles.constrain : ""
        }`}
      >
        {left}
        {right}
      </div>
    )}
    {bottom}
  </div>
);

export default Layout;
