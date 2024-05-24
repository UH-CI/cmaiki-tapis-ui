import { Jobs } from "@tapis/tapis-typescript";
import { apiGenerator, errorDecoder } from "tapis-api/utils";

const submit = (
  request: Jobs.ReqSubmitJob,
  basePath: string,
  jwt: string
): Promise<Jobs.RespSubmitJob> => {
  // Generate the API client
  const api: Jobs.JobsApi = apiGenerator<Jobs.JobsApi>(
    Jobs,
    Jobs.JobsApi,
    basePath,
    jwt
  );
  // Submit the job and handle errors
  return errorDecoder<Jobs.RespSubmitJob>(() => {
    console.log("Calling api.submitJob with request:", request);
    return api.submitJob({ reqSubmitJob: request });
  });
};

export default submit;
