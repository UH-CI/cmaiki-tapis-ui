import React from "react";
import { useRouteMatch, NavLink } from "react-router-dom";
import { useList } from "tapis-hooks/jobs";
import { Jobs } from "@tapis/tapis-typescript";
import { QueryWrapper } from "tapis-ui/_wrappers";
import { Column, Row } from "react-table";
import { InfiniteScrollTable } from "../../../../tapis-ui/_common";
import styles from "./JobsTable.module.scss";

// Pretty print datetime string as a Date object
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);

  const formattedDate = date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "Pacific/Honolulu", // HST timezone
  });
  return formattedDate;
};

interface JobData {
  uuid: string;
  name: string;
  status: string;
  // Add other relevant job properties
}

type JobListingTableProps = {
  jobs: Array<Jobs.JobListDTO>;
  prependColumns?: Array<Column>;
  appendColumns?: Array<Column>;
  getRowProps?: (row: Row) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<"label" | "shortDescription">;
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
    const { url } = useRouteMatch();

    const tableColumns: Array<Column> = [
      ...prependColumns,
      {
        Header: "Name",
        accessor: "name",
        Cell: (el) => {
          return <span>{el.value}</span>;
        },
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: (el) => <span>{el.value}</span>,
      },
      {
        Header: "Created",
        accessor: "created",
        Cell: (el) => <span>{formatDateTime(el.value)}</span>,
      },

      {
        Header: "Ended",
        accessor: "ended",
        Cell: (el) => <span>{formatDateTime(el.value)}</span>,
      },
      {
        Header: "Archive System ID",
        accessor: "archiveSystemId",
        Cell: (el) => <span>{el.value}</span>,
      },
      {
        Header: "Actions",
        Cell: (el: { row: { original: JobData } }) => {
          console.log(`${url}/${el.row.original.uuid}`);
          return (
            <NavLink
              to={`${url}/${el.row.original.uuid}`}
              key={el.row.original.uuid}
              className={styles["action-button"]}
            >
              <span>View</span>
            </NavLink>
          );
        },
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
    <QueryWrapper isLoading={isLoading} error={error}>
      <JobListingTable jobs={jobsList} />
    </QueryWrapper>
  );
};

export default JobsTable;
