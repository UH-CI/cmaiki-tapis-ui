// TODO Write an actual test file, this is a copy of the AppsNav test

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import AppsTable from './AppsTable';
import { useList } from 'tapis-hooks/apps';
import { tapisApp } from 'fixtures/apps.fixtures';

jest.mock('tapis-hooks/apps');

describe('AppsTable', () => {
  it('renders AppsTable component', () => {
    (useList as jest.Mock).mockReturnValue({
      data: {
        result: [tapisApp],
      },
      isLoading: false,
      error: null,
    });

    const { getAllByText } = renderComponent(<AppsTable />);
    expect(getAllByText(/FullJobAttrs/).length).toEqual(1);
  });
});
