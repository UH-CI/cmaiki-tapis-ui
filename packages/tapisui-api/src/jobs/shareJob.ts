import { Jobs } from '@tapis/tapis-typescript';
import { apiGenerator, errorDecoder } from '../utils';

// JobsApi client doesn't include shareJob (POST /v3/jobs/{jobUuid}/share),
// This subclass adds it using the protected `request` helper
class JobsApiWithShare extends Jobs.JobsApi {
  shareJob(
    jobUuid: string,
    reqShareJob: Jobs.ReqShareJob
  ): Promise<Jobs.RespShareJob> {
    return this.request({
      path: `/v3/jobs/${encodeURIComponent(jobUuid)}/share`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: Jobs.ReqShareJobToJSON(reqShareJob),
    }).then((response) => Jobs.RespShareJobFromJSON(response));
  }
}

const shareJob = (
  jobUuid: string,
  request: Jobs.ReqShareJob,
  basePath: string,
  jwt: string
): Promise<Jobs.RespShareJob> => {
  const api: JobsApiWithShare = apiGenerator<JobsApiWithShare>(
    Jobs,
    JobsApiWithShare,
    basePath,
    jwt
  );
  return errorDecoder<Jobs.RespShareJob>(() => api.shareJob(jobUuid, request));
};

export default shareJob;
