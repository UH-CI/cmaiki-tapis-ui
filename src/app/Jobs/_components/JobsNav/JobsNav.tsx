import React from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Jobs as Hooks } from '@tapis/tapisui-hooks';
import { Jobs } from '@tapis/tapis-typescript';
import {
  QueryWrapper,
  FilterableObjectsList,
  JobStatusIcon,
} from '@tapis/tapisui-common';
import { Work } from '@mui/icons-material';

const JobsNav: React.FC = () => {
  const history = useHistory();
  const { data, isLoading, error } = Hooks.useList();
  const { url } = useRouteMatch();
  const jobs: Array<Jobs.JobListDTO> = data?.result ?? [];

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <FilterableObjectsList
        objects={jobs}
        defaultField={'lastUpdated'}
        defaultOnClickItem={(job: any) => {
          history.push(`${url}/${job.uuid}`);
        }}
        includeAll={true}
        includeAllGroupLabel="All Jobs"
        includeAllSelectorLabel="all jobs"
        includeAllPrimaryItemText={({ object }: any) => object.name}
        includeAllSecondaryItemText={({ object }: any) =>
          `${object.appId}${object.appVersion} `
        }
        defaultGroupIcon={<Work />}
        filterable={false}
        groupable={true}
        groups={[
          {
            field: 'status',
            groupSelectorLabel: 'status',
            primaryItemText: ({ object }: any) => object.name, // TODO FIXME This 'any' makes me sad. Fix
            secondaryItemText: ({ object }: any) =>
              `${object.appId}${object.appVersion}`, // TODO FIXME This 'any' makes me sad. Fix
            open: [],
            tooltip: ({ fieldValue }: any) => fieldValue, // TODO FIXME This 'any' makes me sad. Fix
            onClickItem: (object: any) => {
              history.push(`${url}/${object.uuid}`);
            },
            groupLabel: ({ fieldValue }: any) => fieldValue,
            groupIcon: (
              { fieldValue }: any // TODO FIXME This 'any' makes me sad. Fix
            ) => (
              <JobStatusIcon
                status={fieldValue}
                animation={
                  fieldValue === Jobs.JobListDTOStatusEnum.Running
                    ? 'rotate'
                    : undefined
                }
              />
            ),
            groupItemIcon: (
              { fieldValue }: any // TODO FIXME This 'any' makes me sad. Fix
            ) => (
              <JobStatusIcon
                status={fieldValue}
                animation={
                  fieldValue === Jobs.JobListDTOStatusEnum.Running
                    ? 'rotate'
                    : undefined
                }
              />
            ),
          },
          {
            field: 'lastUpdated',
            groupSelectorLabel: 'last updated',
            primaryItemText: ({ object }: any) => object.name, // TODO FIXME This 'any' makes me sad. Fix
            secondaryItemText: ({ object }: any) =>
              `${object.appId}:${object.appVersion}`, // TODO FIXME This 'any' makes me sad. Fix
            open: ['*'],
            tooltip: ({ fieldValue }: any) => fieldValue, // TODO FIXME This 'any' makes me sad. Fix
            onClickItem: (object: any) => {
              history.push(`${url}/${object.uuid}`);
            },
            showDropdown: false,
            groupLabel: () => 'test',
            groupIcon: () => '',
            groupItemIcon: (
              { object }: any // TODO FIXME This 'any' makes me sad. Fix
            ) => (
              <JobStatusIcon
                status={object.status}
                animation={
                  object.status === Jobs.JobListDTOStatusEnum.Running
                    ? 'rotate'
                    : undefined
                }
              />
            ),
          },
        ]}
      />
    </QueryWrapper>
  );
};

export default JobsNav;
