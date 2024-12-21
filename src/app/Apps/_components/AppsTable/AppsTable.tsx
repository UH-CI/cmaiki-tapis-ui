import React from "react";
import { useRouteMatch, NavLink } from "react-router-dom";
import { useList } from "@tapis/tapisui-hooks/dist/apps";
import { Apps as Hooks } from "@tapis/tapisui-hooks";
import { Apps } from "@tapis/tapis-typescript";
import { QueryWrapper } from "@tapis/tapisui-common/dist/wrappers";
import { Column, Row } from "react-table";
import { InfiniteScrollTable, Icon } from "@tapis/tapisui-common/dist/ui";
import styles from "./AppsTable.module.scss";

interface AppData {
  id: string;
  version: string;
  owner?: string;
  description?: string;
  created?: string;
}

type AppListingTableProps = {
  apps?: Array<Apps.TapisApp>;
  prependColumns?: Array<Column>;
  appendColumns?: Array<Column>;
  getRowProps?: (row: Row) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<"label" | "shortDescription">;
};

export const AppListingTable: React.FC<AppListingTableProps> = React.memo(
  ({
    // apps,
    prependColumns = [],
    appendColumns = [],
    getRowProps,
    onInfiniteScroll,
    // isLoading,
  }) => {
    const { url } = useRouteMatch();
    const { data, isLoading, error } = Hooks.useList(
      {
        listType: Apps.ListTypeEnum.All,
        select: "allAttributes",
        computeTotal: true,
      },
      { refetchOnWindowFocus: false }
    );

    // const apps: Array<Apps.TapisApp> = data?.result ?? [];

    const appList: Array<Apps.TapisApp> = data?.result ?? [];

    const excludeList = ["16S-v0.0.2-pipeline-uhhpc"];

    const filteredAppList = appList.filter((app) => {
      if (!app || !app.id) {
        return false;
      }

      const isExcluded = excludeList.includes(app.id);
      return !isExcluded;
    });

    const appOrder = [
      "demux-uhhpc",
      "ITS-pipeline-uhhpc",
      "16Sv1-pipeline-uhhpc",
      "ampliseq-ITS-pipeline-uhhpc",
    ];

    const sortedAppList = filteredAppList.sort((a, b) => {
      const indexA = appOrder.indexOf(a.id ?? "");
      const indexB = appOrder.indexOf(b.id ?? "");

      const orderA = indexA === -1 ? appOrder.length : indexA;
      const orderB = indexB === -1 ? appOrder.length : indexB;

      return orderA - orderB;
    });

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
        tableData={sortedAppList}
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

  return (
    <div style={{ padding: "0.5rem", margin: "0.5rem", border: "1px #88888" }}>
      <QueryWrapper isLoading={isLoading} error={error}>
        <AppListingTable />
      </QueryWrapper>
    </div>
  );
};

export default AppsTable;
