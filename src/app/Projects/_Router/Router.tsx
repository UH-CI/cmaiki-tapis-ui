import React, { useContext, useEffect, useState } from 'react';
import {
  Route,
  RouteComponentProps,
  Switch,
  useRouteMatch,
} from 'react-router-dom';
import {
  QueryWrapper,
  SectionMessage,
  FileListing,
} from '@tapis/tapisui-common';
import { Systems as Hooks } from '@tapis/tapisui-hooks';
import { Systems } from '@tapis/tapis-typescript';
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import ManageProjectUsersModal from '../_components/ManageProjectUsersModal';
import { isProjectSystem } from '../projectUtils';
import {
  FilesContext,
  FilesProvider,
  useFilesSelect,
} from '../../Files/_components/FilesContext';
import Toolbar from '../../Files/_components/Toolbar';

const ProjectDetail: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const { currentPath, setCurrentPath } = useContext(FilesContext);
  const { selectedFiles, select, unselect, clear } = useFilesSelect();
  const { data, isLoading, error } = Hooks.useDetails({
    systemId: projectId,
    select: 'allAttributes',
  });
  const project = data?.result;
  const isProject = project !== undefined && isProjectSystem(project);

  useEffect(() => {
    setCurrentPath('/');
    clear();
  }, [projectId, setCurrentPath, clear]);

  const handlePathChange = (path: string) => {
    setCurrentPath(path || '/');
    clear();
  };

  const users =
    isProject && project
      ? [
          ...new Set(
            [project.owner, ...(project.sharedWithUsers ?? [])].filter(
              (username): username is string => Boolean(username)
            )
          ),
        ]
      : [];

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      {isProject && project ? (
        <div style={{ margin: '1rem', overflow: 'auto' }}>
          <Typography variant="h5">{project.id}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            {project.description || 'No description provided.'}
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setIsManageUsersOpen(true)}
            sx={{ mb: 2 }}
          >
            Manage Project Users
          </Button>

          <Typography variant="h6">Users with access</Typography>
          {users.length > 0 ? (
            <List dense>
              {users.map((username) => (
                <ListItem key={username}>
                  <ListItemText
                    primary={username}
                    secondary={username === project.owner ? 'Owner' : undefined}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ my: 1 }}>
              No users have been granted access.
            </Typography>
          )}
          {project.isPublic && (
            <Alert severity="info" sx={{ my: 1 }}>
              This system is public and can be accessed by all users.
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Root directory
          </Typography>
          <Toolbar systemId={projectId} currentPath={currentPath} />
          <FileListing
            key={projectId}
            systemId={projectId}
            path="/"
            selectMode={{ mode: 'multi', types: ['dir', 'file'] }}
            selectedFiles={selectedFiles}
            onSelect={(files) => select(files, 'multi')}
            onUnselect={unselect}
            onPathChange={handlePathChange}
          />
          <ManageProjectUsersModal
            open={isManageUsersOpen}
            onClose={() => setIsManageUsersOpen(false)}
            project={project}
          />
        </div>
      ) : (
        <Alert severity="warning" sx={{ m: 2 }}>
          Project not found.
        </Alert>
      )}
    </QueryWrapper>
  );
};

const ProjectLanding: React.FC = () => {
  const { data, isLoading, error } = Hooks.useList({
    listType: Systems.ListTypeEnum.All,
    select: 'allAttributes',
    computeTotal: true,
    limit: 1000,
  });
  const projects = (data?.result ?? []).filter(isProjectSystem);

  return (
    <QueryWrapper isLoading={isLoading} error={error ?? null}>
      <div style={{ margin: '1rem', flex: 1, overflow: 'auto' }}>
        <SectionMessage type="info">
          {projects.length === 0
            ? 'No projects found.'
            : 'Select a project from the list.'}
        </SectionMessage>
      </div>
    </QueryWrapper>
  );
};

const ProjectRouter: React.FC = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <ProjectLanding />
      </Route>
      <Route
        path={`${path}/:projectId`}
        render={({
          match: {
            params: { projectId },
          },
        }: RouteComponentProps<{ projectId: string }>) => (
          <ProjectDetail projectId={projectId} />
        )}
      />
    </Switch>
  );
};

const Router: React.FC = () => (
  <FilesProvider>
    <ProjectRouter />
  </FilesProvider>
);

export default Router;
