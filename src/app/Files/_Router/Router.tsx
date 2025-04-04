import React from 'react';
import {
  Route,
  useRouteMatch,
  RouteComponentProps,
  Switch,
  useLocation,
  Redirect,
} from 'react-router-dom';
import FileListing from '../FileListing';
import { SectionMessage } from '@tapis/tapisui-common';

export const backLocation = (
  systemPath: string | undefined,
  pathname: string
) =>
  systemPath ? `${pathname.split('/').slice(0, -2).join('/')}/` : undefined;

const Router: React.FC = () => {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();

  return (
    <Switch>
      <Route path={`${path}`} exact>
        <div style={{ margin: '1rem', flex: 1, overflow: 'auto' }}>
          <SectionMessage type="info">
            Select a system from the list.
          </SectionMessage>
        </div>
      </Route>

      <Route
        path={`${path}/:systemId/:systemPath*`}
        render={({
          match: {
            params: { systemId, systemPath },
          },
        }: RouteComponentProps<{ systemId: string; systemPath?: string }>) => {
          //   Temporary solution specific to accessing C-MAIKI shared storage via andyyu account
          //   Remove once users access via their own accounts
          if (!systemPath && systemId === 'test-zip-koa-hpc-andyyu') {
            return (
              <Redirect
                to={`${path}/${systemId}/home/andyyu/cmaiki_koastore`}
              />
            );
          }

          return (
            <div style={{ margin: '.5rem' }}>
              <FileListing
                systemId={systemId}
                path={systemPath ?? '/'}
                location={pathname}
              />
            </div>
          );
        }}
      />
    </Switch>
  );
};

export default Router;
