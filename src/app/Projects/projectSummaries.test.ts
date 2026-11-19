import { jest } from '@jest/globals';
import {
  createProjectSummaryRecord,
  getProjectSummaryRecords,
} from './projectSummaries';

const fetchMock = jest.fn<typeof fetch>();

describe('project summary metadata helpers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a project summary record in the tenant Meta collection', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);

    await createProjectSummaryRecord(
      'https://tacc.develop.tapis.io/',
      'token',
      'tacc',
      'my-project',
      'Project description'
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/meta/tacc/project_summaries/my-project',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tapis-Token': 'token',
        },
        body: JSON.stringify({
          _id: 'my-project',
          project_name: 'my-project',
          description: 'Project description',
          storage_size: 0,
        }),
      }
    );
  });

  it('paginates Meta records and returns their storage sizes', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Array.from({ length: 1000 }, (_, index) => ({
            _id: `project-${index}`,
            project_name: `project-${index}`,
            description: 'Project description',
            storage_size: index,
          })),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'last-project',
            project_name: 'last-project',
            description: 'Last project',
            storage_size: 25,
          },
        ],
      } as Response);

    const records = await getProjectSummaryRecords(
      'https://tacc.develop.tapis.io',
      'token',
      'tacc'
    );

    expect(records).toHaveLength(1001);
    expect(records.at(-1)).toEqual({
      projectId: 'last-project',
      projectName: 'last-project',
      description: 'Last project',
      storageSize: 25,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://tacc.develop.tapis.io/v3/meta/tacc/project_summaries?page=1&pagesize=1000',
      { headers: { 'X-Tapis-Token': 'token' } }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://tacc.develop.tapis.io/v3/meta/tacc/project_summaries?page=2&pagesize=1000',
      { headers: { 'X-Tapis-Token': 'token' } }
    );
  });
});
