import React, { useEffect, useState } from 'react';
import { useRouteMatch, NavLink } from 'react-router-dom';
import { useList, useDetails } from '@tapis/tapisui-hooks/dist/jobs';
import { Jobs } from '@tapis/tapis-typescript';
import { QueryWrapper } from '@tapis/tapisui-common/dist/wrappers';
import { Column, Row, CellProps } from 'react-table';
import { InfiniteScrollTable, Icon } from '@tapis/tapisui-common';
import styles from './JobsTable.module.scss';
import { useHistory } from 'react-router-dom';

// Pretty print datetime string as a Date object
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    return '---';
  }

  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'Pacific/Honolulu', // HST timezone
  });
  return formattedDate;
};

interface JobData {
  uuid: string;
  name: string;
  status: string;
  value: string;
  details?: Jobs.Job;
  created?: string;
  ended?: string;
}

type JobListingTableProps = {
  jobs: Array<Jobs.JobListDTO>;
  prependColumns?: Array<Column<JobData>>;
  appendColumns?: Array<Column<JobData>>;
  getRowProps?: (row: Row<JobData>) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<'label' | 'shortDescription'>;
};

export const JobListingTable: React.FC<JobListingTableProps> = React.memo(
  ({
    jobs,
    prependColumns = [],
    appendColumns = [],
    getRowProps,
    onInfiniteScroll,
    isLoading,
    fields,
  }) => {
    const [jobUuid, setJobUuid] = useState('');
    const { data, isLoading: isDetailLoading, error } = useDetails(jobUuid);

    // Used in place of a NavLink
    const history = useHistory();
    const { url } = useRouteMatch();

    const handleButtonClick = (uuid: string) => {
      if (uuid !== jobUuid) {
        setJobUuid(uuid); // Only set UUID if it's different to avoid unnecessary re-fetches
      }
    };

    const tableColumns: Array<Column<JobData>> = [
      ...prependColumns,
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value }: CellProps<JobData, string>) => <span>{value}</span>,
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: CellProps<JobData, string>) => <span>{value}</span>,
      },
      {
        Header: 'Created',
        accessor: 'created',
        Cell: ({ value }: CellProps<JobData, string | undefined>) => (
          <span>{formatDateTime(value ?? '---')}</span>
        ),
      },
      {
        Header: 'Ended',
        accessor: 'ended',
        Cell: ({ value }: CellProps<JobData, string | undefined>) => (
          <span>{formatDateTime(value ?? '---')}</span>
        ),
      },
      {
        Header: 'Job Details',
        Cell: ({ row }: CellProps<JobData>) => (
          <NavLink
            to={`${url}/${row.original.uuid}`}
            key={row.original.uuid}
            className={styles['action-button']}
          >
            <Icon name={'document'} />
            <span>View</span>
          </NavLink>
        ),
      },
      {
        Header: 'Output Files',
        accessor: 'uuid',
        Cell: ({ value }: CellProps<JobData, string>) => (
          <button
            onClick={() => handleButtonClick(value)}
            className={styles['pseudo-nav-link']}
          >
            <Icon name={'folder'} className={styles.icon} />
            <span>View</span>
          </button>
        ),
      },
    ];

    tableColumns.push(...appendColumns);

    return (
      <InfiniteScrollTable
        className={styles.JobsTable}
        tableColumns={tableColumns}
        tableData={jobs}
        onInfiniteScroll={onInfiniteScroll}
        isLoading={isLoading}
        noDataText="No Jobs found"
        getRowProps={getRowProps}
      />
    );
  }
);

const JobsTable: React.FC = () => {
  const { data, isLoading, error } = useList();

  const jobsList: Array<Jobs.JobListDTO> = data?.result ?? [];

  return (
    <div style={{ padding: '0.5rem', margin: '0.5rem', border: '1px #88888' }}>
      <QueryWrapper isLoading={isLoading} error={error}>
        <JobListingTable jobs={jobsList} />
      </QueryWrapper>
    </div>
  );
};

export default JobsTable;
