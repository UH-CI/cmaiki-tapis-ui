import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { Location } from 'history';
import { Login as TapisLogin } from '../_components';
import { SectionHeader, PageLayout } from '@tapis/tapisui-common';
import { useTapisConfig } from '@tapis/tapisui-hooks';

const Layout: React.FC = () => {
  const { accessToken } = useTapisConfig();
  let location = useLocation<{ from: Location }>();
  let { from } = location.state || { from: { pathname: '/' } };

  if (accessToken?.access_token) {
    return <Redirect to={from} />;
  }

  const body = (
    <>
      <div className="container">
        {/*<SectionHeader>Login</SectionHeader>*/}
        <TapisLogin />
      </div>
    </>
  );

  return (
    <div style={{ backgroundColor: '#465568', height: '100vh' }}>
      <PageLayout right={body} />
    </div>
  );
};

export default Layout;
