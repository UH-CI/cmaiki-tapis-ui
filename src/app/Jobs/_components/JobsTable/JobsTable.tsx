import React, { useEffect, useState } from 'react';
import { useRouteMatch, NavLink } from 'react-router-dom';
import { useList, useDetails } from '@tapis/tapisui-hooks/dist/jobs';
import { Jobs } from '@tapis/tapis-typescript';
import { QueryWrapper } from '@tapis/tapisui-common/dist/wrappers';
import { Column, Row } from 'react-table';
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
}

type JobListingTableProps = {
  jobs: Array<Jobs.JobListDTO>;
  prependColumns?: Array<Column>;
  appendColumns?: Array<Column>;
  getRowProps?: (row: Row) => any;
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

    // // Fetch job details via UUID to obtain path to job output directory
    // useEffect(() => {
    //   if (
    //     data?.result &&
    //     !isDetailLoading &&
    //     !error &&
    //     data.result.archiveSystemDir
    //   ) {
    //     history.push(
    //       `files/${data.result.archiveSystemId}${data.result.archiveSystemDir}/`
    //     );
    //   }
    // }, [data, isDetailLoading, error, history]);

    const handleButtonClick = (uuid: string) => {
      if (uuid !== jobUuid) {
        setJobUuid(uuid); // Only set UUID if it's different to avoid unnecessary re-fetches
      }
    };

    const tableColumns: Array<Column> = [
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
        Header: 'Created',
        accessor: 'created',
        Cell: (el) => <span>{formatDateTime(el.value)}</span>,
      },

      {
        Header: 'Ended',
        accessor: 'ended',
        Cell: (el) => <span>{formatDateTime(el.value)}</span>,
      },
      {
        Header: 'Job Details',
        Cell: (el: { row: { original: JobData } }) => {
          return (
            <NavLink
              to={`${url}/${el.row.original.uuid}`}
              key={el.row.original.uuid}
              className={styles['action-button']}
            >
              <Icon name={'document'} />
              <span>View</span>
            </NavLink>
          );
        },
      },
      {
        Header: 'Output Files',
        accessor: 'uuid',
        Cell: (el) => (
          <button
            onClick={() => handleButtonClick(el.value)}
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

  // Log to debug the fetched data, loading state, and any errors
  console.log('JobsTable - data:', data);
  console.log('JobsTable - isLoading:', isLoading);
  console.log('JobsTable - error:', error);

  const jobsList: Array<Jobs.JobListDTO> = data?.result ?? [];

  // Log the derived jobs list
  console.log('JobsTable - jobsList:', jobsList);

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <JobListingTable jobs={jobsList} />
    </QueryWrapper>
  );
};

export default JobsTable;
