import React from 'react';
import { default as JobDetail } from '../JobDetail';
import { PageLayout, LayoutHeader } from '@tapis/tapisui-common';
import { JobsToolbar } from 'app/Jobs/_components';
import { Jobs as Hooks } from '@tapis/tapisui-hooks';
import { Link } from 'react-router-dom';

interface JobDetailProps {
  jobUuid: string;
}

const Layout: React.FC<JobDetailProps> = ({ jobUuid }) => {
  const header = (
    <LayoutHeader type={'sub-header'}>
      Job Details
      <Link to="/jobs">Return to Jobs</Link>{' '}
    </LayoutHeader>
  );
  // eslint-disable-next-line
  // const { data, isLoading, error } = Hooks.useDetails(jobUuid);

  // Don't need the below because error message is already shown, as an error not as plain text like below would do
  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  // Use this block below to hide error message and only show in console
  // if (error) {
  //   console.error(error); // Log the error for debugging
  //   return <div>Something went wrong. Please try again later.</div>;
  // }

  const body = (
    <div style={{ flex: 1 }}>
      <JobDetail jobUuid={jobUuid}></JobDetail>
    </div>
  );
  return <PageLayout top={header} right={body}></PageLayout>;
};

export default Layout;
