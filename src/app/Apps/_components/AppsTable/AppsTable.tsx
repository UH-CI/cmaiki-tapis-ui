import React from 'react';
import { useRouteMatch, NavLink } from 'react-router-dom';
import { useList } from '@tapis/tapisui-hooks/dist/apps';
import { Apps as Hooks } from '@tapis/tapisui-hooks';
import { Apps } from '@tapis/tapis-typescript';
import { QueryWrapper } from '@tapis/tapisui-common/dist/wrappers';
import { Column, Row, CellProps } from 'react-table';
import { InfiniteScrollTable, Icon } from '@tapis/tapisui-common/dist/ui';
import styles from './AppsTable.module.scss';

interface AppData {
  id: string;
  version: string;
  owner?: string;
  description?: string;
  created?: string;
}

type AppListingTableProps = {
  apps?: Array<Apps.TapisApp>;
  prependColumns?: Array<Column<AppData>>;
  appendColumns?: Array<Column<AppData>>;
  getRowProps?: (row: Row<AppData>) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  fields?: Array<'label' | 'shortDescription'>;
};

export const AppListingTable: React.FC<AppListingTableProps> = React.memo(
  ({
    prependColumns = [],
    appendColumns = [],
    getRowProps,
    onInfiniteScroll,
  }) => {
    const { url } = useRouteMatch();
    const { data, isLoading, error } = Hooks.useList(
      {
        listType: Apps.ListTypeEnum.All,
        select: 'allAttributes',
        computeTotal: true,
      },
      { refetchOnWindowFocus: false }
    );

    const appList: Array<Apps.TapisApp> = data?.result ?? [];

    const excludeList: string[] = ['ampliseq-condensed-pipeline-test'];

    const filteredAppList = appList.filter((app) => {
      if (!app || !app.id) return false;
      return !excludeList.includes(app.id);
    });

    const appOrder = [
      'demux-uhhpc',
      'ITS-pipeline-uhhpc',
      '16S-v0.0.2-pipeline-uhhpc',
      '16Sv1-pipeline-uhhpc',
      'ampliseq-ITS-pipeline-uhhpc',
      'ampliseq-16S-pipeline-uhhpc',
      // 'ampliseq-condensed-pipeline-test',
      'ampliseq-pipeline-test',
    ];

    const sortedAppList = filteredAppList.sort((a, b) => {
      const indexA = appOrder.indexOf(a.id ?? '');
      const indexB = appOrder.indexOf(b.id ?? '');

      const orderA = indexA === -1 ? appOrder.length : indexA;
      const orderB = indexB === -1 ? appOrder.length : indexB;

      return orderA - orderB;
    });

    const tableColumns: Array<Column<AppData>> = [
      ...prependColumns,
      {
        Header: 'Name',
        accessor: 'id',
        Cell: ({ value }: CellProps<AppData, string>) => <span>{value}</span>,
      },
      {
        Header: 'Short Description',
        accessor: 'description',
        Cell: ({ value }: CellProps<AppData, string | undefined>) => (
          <span>{value}</span>
        ),
      },
      {
        Header: 'App Version',
        accessor: 'version',
        Cell: ({ value }: CellProps<AppData, string>) => <span>{value}</span>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }: CellProps<AppData>) => (
          <NavLink
            to={`${url}/${row.original.id}/${row.original.version}`}
            className={styles['action-button']}
          >
            <Icon name={'push-right'} /> <span>Run</span>
          </NavLink>
        ),
      },
    ];

    tableColumns.push(...appendColumns);

    return (
      <InfiniteScrollTable
        className={styles.AppsTable}
        tableColumns={tableColumns}
        tableData={sortedAppList as AppData[]}
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
    <div style={{ padding: '0.5rem', margin: '0.5rem', border: '1px #88888' }}>
      <QueryWrapper isLoading={isLoading} error={error}>
        <AppListingTable />
      </QueryWrapper>
    </div>
  );
};

export default AppsTable;
