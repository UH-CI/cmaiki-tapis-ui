import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { Systems as Hooks, useTapisConfig } from '@tapis/tapisui-hooks';
import { Systems } from '@tapis/tapis-typescript';
import { Navbar, NavItem } from '@tapis/tapisui-common';
import { QueryWrapper } from '@tapis/tapisui-common';

const SystemsNav: React.FC = () => {
  const { url } = useRouteMatch();
  // Get a systems listing with select: allAttributes
  const { data, isLoading, error } = Hooks.useList({
    select: 'allAttributes',
    listType: Systems.ListTypeEnum.All,
  });
  const { claims } = useTapisConfig();

  const tapisUserName = claims['tapis/username'];
  const definitions: Array<Systems.TapisSystem> = data?.result ?? [];

  // Filter to only display systems where tapisUserName is in sharedWithUsers
  const filteredDefinitions = definitions.filter((system) => {
    return system?.sharedWithUsers?.includes(tapisUserName);
  });

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <Navbar>
        {filteredDefinitions.length ? (
          filteredDefinitions.map((system) => (
            <NavItem to={`${url}/${system.id}`} icon="folder" key={system.id}>
              {`${system.id}`}
            </NavItem>
          ))
        ) : (
          <i style={{ padding: '16px' }}>No accessible systems found</i>
        )}
      </Navbar>
    </QueryWrapper>
  );
};

export default SystemsNav;
