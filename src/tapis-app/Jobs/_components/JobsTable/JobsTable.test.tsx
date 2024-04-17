// TODO Write an actual test file, this is a copy of the JobsNav test

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import renderComponent from "utils/testing";
import JobsTable from "./JobsTable";
import { useList } from "tapis-hooks/jobs";
import { jobInfo } from "fixtures/jobs.fixtures";

jest.mock("tapis-hooks/jobs");

describe("JobsTable", () => {
  it("renders JobsTable component", () => {
    (useList as jest.Mock).mockReturnValue({
      data: {
        result: [jobInfo],
      },
      isLoading: false,
      error: null,
    });

    const { getAllByText } = renderComponent(<JobsTable />);
    expect(getAllByText(/SleepSeconds/).length).toEqual(1);
  });
});
