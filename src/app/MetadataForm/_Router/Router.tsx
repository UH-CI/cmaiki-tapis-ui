import React from 'react';
import { Route, useRouteMatch, Switch } from 'react-router-dom';
import { SectionMessage } from '@tapis/tapisui-common';

const Router: React.FC = () => {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route path={`${path}`} exact>
        <div style={{ margin: '1rem', flex: 1, overflow: 'auto' }}>
          <SectionMessage type="info">Metadata Form</SectionMessage>
        </div>
      </Route>
    </Switch>
  );
};

export default Router;
