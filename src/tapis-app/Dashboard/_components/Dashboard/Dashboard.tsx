import React from "react";
import { Link } from "react-router-dom";
import { SectionHeader, LoadingSpinner, Icon } from "tapis-ui/_common";
import ActivityFeed from "../ActivityFeed";
import { Card, CardBody, CardTitle, CardFooter, CardText } from "reactstrap";
import { useTapisConfig } from "tapis-hooks";
import { useList as useSystemsList } from "tapis-hooks/systems";
import { useList as useJobsList } from "tapis-hooks/jobs";
import { useList as useAppsList } from "tapis-hooks/apps";
import styles from "./Dashboard.module.scss";
import "./Dashboard.scss";

type DashboardCardProps = {
  icon: string;
  link: string;
  counter: string;
  name: string;
  text: string;
  loading: boolean;
  backgroundColor?: string;
  footerColor?: string;
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  link,
  counter,
  name,
  text,
  loading,
  backgroundColor,
  footerColor,
}) => {
  return (
    <Card className={styles.card}>
      <CardBody
        style={{
          backgroundColor: backgroundColor,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className={styles["card-icon-container"]}>
          <Icon className={styles["card-icon"]} name={icon} />
        </div>
        <div className={styles["card-text-container"]}>
          <CardTitle className={styles["card-title"]} tag="h1">
            {loading ? (
              <LoadingSpinner placement="inline" />
            ) : (
              <div>{counter}</div>
            )}
          </CardTitle>
          <CardText className={styles["card-text"]}>{text}</CardText>
        </div>
      </CardBody>
      <Link to={link} style={{ textDecoration: "none" }}>
        <CardFooter
          className={`${styles["card-footer"]} ${styles["card-footer-text"]}`}
          style={{ backgroundColor: footerColor }}
        >
          VIEW MORE
          <Icon name="push-right" />
        </CardFooter>
      </Link>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { claims } = useTapisConfig();
  const systems = useSystemsList({});
  const jobs = useJobsList({});
  const apps = useAppsList({ select: "jobAttributes,version" });

  return (
    <div>
      <SectionHeader className="dashboard__section-header">
        Dashboard for {claims["tapis/tenant_id"]}
      </SectionHeader>
      <div className={styles.cards}>
        <DashboardCard
          icon="jobs"
          name="Jobs"
          text="Jobs"
          link="/jobs"
          counter={`${jobs?.data?.result?.length}`}
          loading={jobs?.isLoading}
          backgroundColor="#4098DC"
          footerColor="#3E90D8"
        />
        <DashboardCard
          icon="applications"
          name="Applications"
          text="Apps"
          link="/apps"
          counter={`${apps?.data?.result?.length}`}
          loading={apps?.isLoading}
          backgroundColor="#4AC5D2"
          footerColor="#45B9C5"
        />
        <DashboardCard
          icon="data-files"
          name="Data"
          text="Data Systems"
          link="/files"
          counter={`${systems?.data?.result?.length}`}
          loading={systems?.isLoading}
          backgroundColor="#70E4CE"
          footerColor="#4FDEC3"
        />
      </div>
      <ActivityFeed />
    </div>
  );
};

export default Dashboard;
