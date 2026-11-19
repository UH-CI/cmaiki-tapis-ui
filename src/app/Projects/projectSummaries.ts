const PROJECT_SUMMARIES_COLLECTION = 'project_summaries';
const PAGE_SIZE = 1000;

export type ProjectSummaryRecord = {
  projectId: string;
  projectName: string;
  description: string;
  storageSize: number;
};

const getProjectSummariesUrl = (basePath: string, tenant: string): string =>
  `${basePath.replace(/\/+$/, '')}/v3/meta/${encodeURIComponent(
    tenant
  )}/${PROJECT_SUMMARIES_COLLECTION}`;

const readErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.text();
  return body.trim() || `Meta API request failed (${response.status}).`;
};

export const createProjectSummaryRecord = async (
  basePath: string,
  accessToken: string,
  tenant: string,
  projectName: string,
  description: string
): Promise<void> => {
  const url = `${getProjectSummariesUrl(basePath, tenant)}/${encodeURIComponent(
    projectName
  )}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tapis-Token': accessToken,
    },
    body: JSON.stringify({
      _id: projectName,
      project_name: projectName,
      description,
      storage_size: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Could not create project summary metadata: ${await readErrorMessage(
        response
      )}`
    );
  }
};

export const getProjectSummaryRecords = async (
  basePath: string,
  accessToken: string,
  tenant: string
): Promise<ProjectSummaryRecord[]> => {
  const records: ProjectSummaryRecord[] = [];
  let page = 1;

  while (true) {
    const query = new URLSearchParams({
      page: String(page),
      pagesize: String(PAGE_SIZE),
    });
    const response = await fetch(
      `${getProjectSummariesUrl(basePath, tenant)}?${query}`,
      { headers: { 'X-Tapis-Token': accessToken } }
    );

    if (!response.ok) {
      throw new Error(
        `Could not retrieve project summary metadata: ${await readErrorMessage(
          response
        )}`
      );
    }

    const result: unknown = await response.json();
    if (!Array.isArray(result)) {
      throw new Error(
        'The Meta API returned an invalid project summaries list.'
      );
    }

    for (const record of result) {
      if (
        typeof record !== 'object' ||
        record === null ||
        !('_id' in record) ||
        typeof record._id !== 'string' ||
        !('project_name' in record) ||
        typeof record.project_name !== 'string' ||
        !('description' in record) ||
        typeof record.description !== 'string' ||
        !('storage_size' in record) ||
        typeof record.storage_size !== 'number' ||
        !Number.isFinite(record.storage_size) ||
        record.storage_size < 0
      ) {
        throw new Error(
          'The Meta API returned an invalid project summary record.'
        );
      }

      records.push({
        projectId: record._id,
        projectName: record.project_name,
        description: record.description,
        storageSize: record.storage_size,
      });
    }

    if (result.length < PAGE_SIZE) return records;
    page += 1;
  }
};
