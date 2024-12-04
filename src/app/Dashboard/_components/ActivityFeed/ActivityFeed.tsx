import React from 'react';
import { NavLink } from 'react-router-dom';
import { useList } from '@tapis/tapisui-hooks/dist/jobs';
import { Jobs } from '@tapis/tapis-typescript';
import { QueryWrapper } from '@tapis/tapisui-common/dist/wrappers';
import { Column, Row } from 'react-table';
import { InfiniteScrollTable, Icon } from '@tapis/tapisui-common/dist/ui';
import styles from './ActivityFeed.module.scss';

interface JobData {
  uuid: string;
  name: string;
  status: string;
  value: string;
  details?: Jobs.Job;
}

type ActivityFeedListingProps = {
  jobs: Array<Jobs.JobListDTO>;
  prependColumns?: Array<Column<JobData>>;
  appendColumns?: Array<Column<JobData>>;
  getRowProps?: (row: Row<JobData>) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<'label' | 'shortDescription'>;
};

export const ActivityFeedListing: React.FC<ActivityFeedListingProps> =
  React.memo(
    ({
      jobs,
      prependColumns = [],
      appendColumns = [],
      getRowProps,
      onInfiniteScroll,
      isLoading,
      fields,
    }) => {
      const tableColumns: Array<Column<JobData>> = [
        ...prependColumns,
        {
          Header: 'Name',
          accessor: 'name',
          Cell: (el) => {
            return <span>{el.value}</span>;
          },
        },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: (el) => <span>{el.value}</span>,
        },
        {
          Header: 'Job Details',
          Cell: (el: { row: { original: JobData } }) => {
            return (
              <NavLink
                to={`jobs/${el.row.original.uuid}`}
                key={el.row.original.uuid}
                className={styles['action-button']}
              >
                <Icon name={'document'} />
                <span>View</span>
              </NavLink>
            );
          },
        },
      ];

      tableColumns.push(...appendColumns);

      return (
        <div className={styles.ActivityFeedContainer}>
          <h2 className={styles.Header}>Activity Feed</h2>
          <InfiniteScrollTable
            className={styles.ActivityFeed}
            tableColumns={tableColumns}
            tableData={jobs.slice(0, 5)} // Only take the 10 most recent jobs
            onInfiniteScroll={onInfiniteScroll}
            isLoading={isLoading}
            noDataText="No Jobs found"
            getRowProps={getRowProps}
          />
        </div>
      );
    }
  );

const ActivityFeed: React.FC = () => {
  const { data, isLoading, error } = useList();

  const jobsList: Array<Jobs.JobListDTO> = data?.result ?? [];

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <ActivityFeedListing jobs={jobsList} />
    </QueryWrapper>
  );
};

export default ActivityFeed;
