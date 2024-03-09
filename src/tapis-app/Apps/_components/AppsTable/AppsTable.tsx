import React from "react";
import { useRouteMatch, NavLink } from "react-router-dom";
import { useList } from "tapis-hooks/apps";
import { Apps } from "@tapis/tapis-typescript";
import { QueryWrapper } from "tapis-ui/_wrappers";
import { Column, Row } from "react-table";
import { Icon, InfiniteScrollTable } from "../../../../tapis-ui/_common";
import styles from "./AppsTable.module.scss";

type AppListingTableProps = {
  apps: Array<Apps.TapisApp>;
  prependColumns?: Array<Column>;
  appendColumns?: Array<Column>;
  getRowProps?: (row: Row) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<"label" | "shortDescription">;
};

export const AppListingTable: React.FC<AppListingTableProps> = React.memo(
  ({
    apps,
    prependColumns = [],
    appendColumns = [],
    getRowProps,
    onInfiniteScroll,
    isLoading,
    fields,
  }) => {
    const tableColumns: Array<Column> = [
      ...prependColumns,
      {
        Header: "Name",
        accessor: "id",
        Cell: (el) => {
          console.log(el.row.original);
          return <span>{el.value}</span>;
        },
      },
      {
        Header: "Short Description",
        accessor: "description",
        Cell: (el) => <span>{String(el.value)}</span>,
      },
      {
        Header: "Actions",
        Cell: (el) => (
          <NavLink to={`./`} className={styles["action-button"]}>
            <Icon name={"push-right"} /> <span>Run</span>
          </NavLink>
        ),
      },
    ];

    tableColumns.push(...appendColumns);

    return (
      <InfiniteScrollTable
        className={styles.AppsTable}
        tableColumns={tableColumns}
        tableData={apps}
        onInfiniteScroll={onInfiniteScroll}
        isLoading={isLoading}
        noDataText="No Apps found"
        getRowProps={getRowProps}
      />
    );
  }
);

const AppsTable: React.FC = () => {
  const { data, isLoading, error } = useList(
    {},
    { refetchOnWindowFocus: false }
  );

  // const { url } = useRouteMatch();
  const appList: Array<Apps.TapisApp> = data?.result ?? [];

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <AppListingTable apps={appList} />
    </QueryWrapper>
  );
};

export default AppsTable;
