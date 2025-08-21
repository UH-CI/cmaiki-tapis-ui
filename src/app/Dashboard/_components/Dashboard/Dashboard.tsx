import React from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, LoadingSpinner, Icon } from '@tapis/tapisui-common';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardFooter,
  CardText,
} from 'reactstrap';
import {
  useTapisConfig,
  Systems as SystemsHooks,
  Jobs as JobsHooks,
  Apps as AppsHooks,
  Authenticator as AuthenticatorHooks,
} from '@tapis/tapisui-hooks';
import styles from './Dashboard.module.scss';
import './Dashboard.scss';
import { Apps, Systems } from '@tapis/tapis-typescript';
import ActivityFeed from '../ActivityFeed';

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
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div className={styles['card-icon-container']}>
          <Icon className={styles['card-icon']} name={icon} />
        </div>
        <div className={styles['card-text-container']}>
          <CardTitle className={styles['card-title']}>
            {loading ? (
              <LoadingSpinner placement="inline" />
            ) : (
              <div>{counter}</div>
            )}
          </CardTitle>
          <CardText className={styles['card-text']}>{text}</CardText>
        </div>
      </CardBody>
      <Link to={link} style={{ textDecoration: 'none' }}>
        <CardFooter
          className={`${styles['card-footer']} ${styles['card-footer-text']}`}
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
  const { accessToken, claims } = useTapisConfig();
  const systems = SystemsHooks.useList({
    listType: Systems.ListTypeEnum.All,
    select: 'allAttributes',
    computeTotal: true,
    limit: 1000,
  });
  const jobs = JobsHooks.useList({});
  const apps = AppsHooks.useList({
    listType: Apps.ListTypeEnum.All,
    select: 'jobAttributes,version',
    computeTotal: true,
  });
  return (
    <div>
      <SectionHeader className={styles.header}>
        <div style={{ marginLeft: '1.2rem', fontWeight: 'bolder' }}>
          C-MAIKI Gateway
          {/*Dashboard for {claims['tapis/tenant_id']}*/}
        </div>
      </SectionHeader>
      <div className={styles.cards}>
        {accessToken ? (
          <>
            {/*<DashboardCard*/}
            {/*  icon="data-files"*/}
            {/*  name="Systems"*/}
            {/*  text="View TAPIS systems"*/}
            {/*  link="/systems"*/}
            {/*  counter={`${systems?.data?.result?.length} systems`}*/}
            {/*  loading={systems?.isLoading}*/}
            {/*/>*/}
            <DashboardCard
              icon="jobs"
              name="Jobs"
              // text="View status and details for previously launched TAPIS jobs"
              link="/jobs"
              counter={`${jobs?.data?.result?.length}`}
              text={'Jobs'}
              loading={jobs?.isLoading}
              backgroundColor="#4098DC"
              footerColor="#3E90D8"
            />
            <DashboardCard
              icon="applications"
              name="Applications"
              // text="View TAPIS applications and launch jobs"
              link="/apps"
              counter={`${apps?.data?.result?.length}`}
              text={'Apps'}
              loading={apps?.isLoading}
              backgroundColor="#4AC5D2"
              footerColor="#45B9C5"
            />
            <DashboardCard
              icon="folder"
              name="Files"
              // text="Access files available on TAPIS systems"
              link="/files"
              counter={`${systems?.data?.result?.length}`}
              text={'Data Systems'}
              loading={systems?.isLoading}
              backgroundColor="#70E4CE"
              footerColor="#4FDEC3"
            />
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className={styles['card-header']}>
                <div>
                  <Icon name="user" className="dashboard__card-icon" />
                </div>
                <div>You are not logged in</div>
              </div>
            </CardHeader>
            <CardBody>
              <CardTitle>Please log in to use TAPIS</CardTitle>
            </CardBody>
            <CardFooter className={styles['card-footer']}>
              <Link to="/login">Proceed to login</Link>
              <Icon name="push-right" />
            </CardFooter>
          </Card>
        )}
      </div>
      <div className={styles['activity-feed-container']}>
        <ActivityFeed />
      </div>
    </div>
  );
};

export default Dashboard;
