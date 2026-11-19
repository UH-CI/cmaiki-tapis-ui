import React from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Systems as Hooks } from '@tapis/tapisui-hooks';
import { Systems } from '@tapis/tapis-typescript';
import { QueryWrapper } from '@tapis/tapisui-common';
import { List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { Storage } from '@mui/icons-material';
import { isProjectSystem } from '../projectUtils';

const ProjectsNav: React.FC = () => {
  const { url } = useRouteMatch();
  const selectedProjectMatch = useRouteMatch<{ projectId: string }>(
    `${url}/:projectId`
  );
  const history = useHistory();
  const { data, isLoading, error } = Hooks.useList({
    listType: Systems.ListTypeEnum.All,
    select: 'allAttributes',
    computeTotal: true,
    limit: 1000,
  });
  const projects = (data?.result ?? []).filter(isProjectSystem);

  return (
    <QueryWrapper isLoading={isLoading} error={error ?? null}>
      {projects.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: 2 }}>
          No projects found.
        </Typography>
      ) : (
        <List dense>
          {projects.map((project) => (
            <ListItemButton
              key={project.id}
              selected={selectedProjectMatch?.params.projectId === project.id}
              onClick={() =>
                history.push(`${url}/${encodeURIComponent(project.id!)}`)
              }
            >
              <Storage sx={{ mr: 1 }} />
              <ListItemText
                primary={project.id}
                secondary={project.description}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </QueryWrapper>
  );
};

export default ProjectsNav;
