import React from "react";
import { useRouteMatch, NavLink } from "react-router-dom";
import { useList } from "tapis-hooks/apps";
import { Apps } from "@tapis/tapis-typescript";
import { QueryWrapper } from "tapis-ui/_wrappers";
import { Column, Row } from "react-table";
import { Icon, InfiniteScrollTable } from "../../../../tapis-ui/_common";
import styles from "./AppsTable.module.scss";

interface AppData {
  id: string;
  version: string;
  owner?: string;
  description?: string;
  created?: string;
}

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
  }) => {
    const { url } = useRouteMatch();

    const tableColumns: Array<Column> = [
      ...prependColumns,
      {
        Header: "Name",
        accessor: "id",
        Cell: (el) => <span>{el.value}</span>,
      },
      //   Undefined
      {
        Header: "Short Description",
        accessor: "description",
        Cell: (el) => {
          return <span>{el.value}</span>;
        },
      },
      {
        Header: "App Version",
        accessor: "version",
        Cell: (el) => {
          return <span>{el.value}</span>;
        },
      },
      {
        Header: "Actions",
        Cell: (el: { row: { original: AppData } }) => {
          return (
            <NavLink
              to={`${url}/${el.row.original.id}/${el.row.original.version}`}
              className={styles["action-button"]}
              // onClick={() => setActive(false)}
            >
              <Icon name={"push-right"} /> <span>Run</span>
            </NavLink>
          );
        },
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

  const appList: Array<Apps.TapisApp> = data?.result ?? [];
  // appList.forEach((app) => {
  //   console.log(app);
  // });

  // Only publish apps that are >= version 1.0
  const filteredAppList = appList.filter((app) => {
    if (!app || typeof app.version !== "string") {
      return false;
    }
    const versionNumber = parseFloat(app.version);
    return !isNaN(versionNumber) && versionNumber >= 1.0;
  });

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <AppListingTable apps={filteredAppList} />
    </QueryWrapper>
  );
};

export default AppsTable;
