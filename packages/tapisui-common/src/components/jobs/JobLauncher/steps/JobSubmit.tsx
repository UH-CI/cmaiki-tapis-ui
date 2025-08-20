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

// Helper function to generate specific error messages
const getValidationErrors = (job: any, app: any, systems: any): string[] => {
  const errors: string[] = [];

  console.log('Validation input:', {
    jobExecSystemId: job.execSystemId,
    appExecSystemId: app.jobAttributes?.execSystemId,
    systemsCount: systems?.length,
  });

  const execSystemResult = validateExecSystem(job, app, systems);
  console.log('validateExecSystem result:', execSystemResult);

  if (execSystemResult !== ValidateExecSystemResult.Complete) {
    console.log('Validation failed:', execSystemResult);
    errors.push('Execution system configuration is incomplete or invalid');
  }

  const jobFieldsComplete = jobRequiredFieldsComplete(job);
  if (!jobFieldsComplete) {
    errors.push('Required job fields are missing or incomplete');
  }

  const fileInputsOK = fileInputsComplete(app, job.fileInputs ?? []);
  if (!fileInputsOK) {
    errors.push('Required file inputs are missing');
  }

  const fileInputArraysOK = fileInputArraysComplete(
    app,
    job.fileInputArrays ?? []
  );
  if (!fileInputArraysOK) {
    errors.push('Required file input arrays are incomplete');
  }

  console.log('Final validation:', { totalErrors: errors.length, errors });
  return errors;
};

// Helper function to format error messages
const formatErrorMessage = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];

  return `Multiple issues found: ${errors.join('; ')}`;
};

export const JobSubmit: React.FC = () => {
  const { job, app, systems } = useJobLauncher();
  const history = useHistory();

  // Debug hook values
  console.log('useJobLauncher:', {
    hasJob: !!job,
    hasApp: !!app,
    systemsCount: systems?.length,
  });

  const validationErrors = getValidationErrors(job, app, systems);
  const isComplete = validationErrors.length === 0;
  const errorMessage = formatErrorMessage(validationErrors);

  const { isLoading, error, isSuccess, submit, data } = Hooks.useSubmit(
    app.id!,
    app.version!
  );

  const onSubmit = useCallback(() => {
    console.log('Submitting job');
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
        <StepSummaryField field={summary} error={errorMessage} />
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

  const validationErrors = getValidationErrors(job, app, systems);
  const isComplete = validationErrors.length === 0;
  const errorMessage = formatErrorMessage(validationErrors);

  return (
    <div>
      <StepSummaryField
        field={isComplete ? 'The job is ready for submission' : undefined}
        error={errorMessage}
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
