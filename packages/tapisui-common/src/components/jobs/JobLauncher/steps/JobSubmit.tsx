import { useCallback } from 'react';
import { useJobLauncher } from '../components';
import { JSONDisplay } from '../../../../ui';
import { fileInputsComplete } from '../../../../utils/jobFileInputs';
import { fileInputArraysComplete } from '../../../../utils/jobFileInputArrays';
import { jobRequiredFieldsComplete } from '../../../../utils/jobRequiredFields';
import {
  validateExecSystem,
  ValidateExecSystemResult,
} from '../../../../utils/jobExecSystem';
import { StepSummaryField } from '../components';
import { SubmitWrapper } from '../../../../wrappers';
import { Jobs } from '@tapis/tapis-typescript';
import { Jobs as Hooks } from '@tapis/tapisui-hooks';
import { JobStep } from '..';
import { Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import arrayStyles from '../FieldArray.module.scss';

export const JobSubmit: React.FC = () => {
  const { job, app, systems } = useJobLauncher();
  const history = useHistory();

  const isComplete =
    validateExecSystem(job, app, systems) ===
      ValidateExecSystemResult.Complete &&
    jobRequiredFieldsComplete(job) &&
    fileInputsComplete(app, job.fileInputs ?? []) &&
    fileInputArraysComplete(app, job.fileInputArrays ?? []);

  const { isLoading, error, isSuccess, submit, data } = Hooks.useSubmit(
    app.id!,
    app.version!
  );

  const onSubmit = useCallback(() => {
    // Filter out empty args to ensure only valid arguments are submitted
    const modifiedJob = {
      ...job,
      parameterSet: {
        ...job.parameterSet,
        appArgs:
          job.parameterSet?.appArgs?.filter(
            (arg) => arg.arg && arg.arg.trim() !== ''
          ) || [],
      },
    };

    submit(modifiedJob as Jobs.ReqSubmitJob);
  }, [submit, job]);

  const navigateToJobDetails = useCallback(() => {
    if (data?.result?.uuid) {
      history.push(`/jobs/${data.result.uuid}`);
    }
  }, [history, data?.result?.uuid]);

  const summary = isComplete
    ? isSuccess
      ? `Successfully submitted job ${data?.result?.uuid ?? ''}`
      : `The job is ready for submission`
    : undefined;

  return (
    <div>
      <h2>Job Submission</h2>
      <div className={arrayStyles['form-preview-group']}>
        <StepSummaryField
          field={summary}
          error="All required fields must be completed before the job can be submitted"
        />
        <SubmitWrapper
          isLoading={isLoading}
          error={error}
          success={isSuccess ? ` ` : ''}
          reverse={true}
        >
          {isSuccess && data?.result?.uuid ? (
            <Button color="secondary" onClick={navigateToJobDetails}>
              View Job Details
            </Button>
          ) : (
            <Button
              color="primary"
              disabled={isLoading || !isComplete}
              onClick={onSubmit}
            >
              Submit Job
            </Button>
          )}
        </SubmitWrapper>
      </div>
      <div>
        This is a preview of the json job submission data. You may copy it for
        future reference.
      </div>
      <JSONDisplay json={job} />
    </div>
  );
};

export const JobSubmitSummary: React.FC = () => {
  const { app, job, systems } = useJobLauncher();
  const isComplete =
    validateExecSystem(job, app, systems) &&
    jobRequiredFieldsComplete(job) &&
    fileInputsComplete(app, job.fileInputs ?? []) &&
    fileInputArraysComplete(app, job.fileInputArrays ?? []);

  return (
    <div>
      <StepSummaryField
        field={isComplete ? 'The job is ready for submission' : undefined}
        error="All required fields must be completed before the job can be submitted"
        key="job-submit-summary"
      />
    </div>
  );
};

const step: JobStep = {
  id: 'jobSubmit',
  name: 'Job Submission',
  render: <JobSubmit />,
  summary: <JobSubmitSummary />,
  validationSchema: {},
  generateInitialValues: () => ({}),
};

export default step;
