import React, { useCallback, useMemo } from 'react';
import { WizardStep } from '../../../wrappers/Wizard';
import { QueryWrapper, Wizard } from '../../../wrappers';
import SingleFormWizard from '../../../wrappers/Wizard/SingleFormWizard';

import { Apps, Jobs, Systems } from '@tapis/tapis-typescript';
import { Apps as AppsHooks } from '@tapis/tapisui-hooks';
import generateJobDefaults from '../../../utils/jobDefaults';
import { Systems as SystemsHooks } from '@tapis/tapisui-hooks';
import { useJobLauncher, JobLauncherProvider } from './components';
import { JobStep } from '.';
import jobSteps from './steps';

type JobLauncherWizardProps = {
  appId: string;
  appVersion: string;
};

export const JobLauncherWizardRender: React.FC<{
  jobSteps: Array<JobStep>;
}> = ({ jobSteps }) => {
  const { add, job, app, systems } = useJobLauncher();

  const formSubmit = useCallback(
    (value: Partial<Jobs.ReqSubmitJob>) => {
      if (value.jobType === Apps.JobTypeEnum.Fork) {
        value.execSystemLogicalQueue = undefined;
      }
      if (value.isMpi) {
        value.cmdPrefix = undefined;
      } else {
        value.mpiCmd = undefined;
      }
      if (value.parameterSet) {
        value.parameterSet = {
          ...job.parameterSet,
          ...value.parameterSet,
        };
      }

      // Auto-add/remove -A cmaiki scheduler option based on execSystemLogicalQueue
      const schedulerOptions = value.parameterSet?.schedulerOptions ?? [];
      const hasAccountArg = schedulerOptions.some((arg) =>
        arg.arg?.includes('-A cmaiki')
      );

      // If default or explicitly cmaiki, use cmaiki
      const effectiveQueue = value.execSystemLogicalQueue ?? 'cmaiki';

      if (effectiveQueue === 'cmaiki') {
        // Add -A cmaiki if not present
        if (!hasAccountArg) {
          value.parameterSet = {
            ...value.parameterSet,
            schedulerOptions: [
              ...schedulerOptions,
              {
                name: 'Account',
                description: 'SLURM account for cmaiki queue',
                include: true,
                arg: '-A cmaiki',
              },
            ],
          };
        }
      } else {
        // Remove -A cmaiki if present and queue is not cmaiki
        if (hasAccountArg) {
          value.parameterSet = {
            ...value.parameterSet,
            schedulerOptions: schedulerOptions.filter(
              (arg) => !arg.arg?.includes('-A cmaiki')
            ),
          };
        }
      }

      // // Auto-set archiveSystemDir based on first fileInput sourceUrl
      // const fileInputs = value.fileInputs ?? [];
      // if (fileInputs.length > 0 && fileInputs[0].sourceUrl) {
      //   const sourceUrl = fileInputs[0].sourceUrl;
      //
      //   // Parse tapis://cmaiki-v2-koa-hpc-Project_A/raw_data/...
      //   const tapisUrlRegex = /^tapis:\/\/cmaiki-v2-koa-hpc-([^\/]+)/;
      //   const match = sourceUrl.match(tapisUrlRegex);
      //
      //   if (match && match[1]) {
      //     const projectName = match[1];
      //     // Set archiveSystemDir to /ProjectName/jobs/${JobUUID}
      //     value.archiveSystemDir = `/${projectName}/jobs/\${JobUUID}`;
      //   }
      // }

      add(value);
    },
    [add, job]
  );

  // Map Array of JobSteps into an array of WizardSteps
  const steps: Array<WizardStep<Jobs.ReqSubmitJob>> = useMemo(() => {
    return jobSteps.map((jobStep) => {
      const { generateInitialValues, validateThunk, ...stepProps } = jobStep;
      return {
        initialValues: generateInitialValues({ job, app, systems }),
        // generate a validation function from the JobStep's validateThunk, given the current hook values
        validate: validateThunk
          ? validateThunk({ job, app, systems })
          : undefined,
        ...stepProps,
      };
    });
  }, [app, job, systems, jobSteps]);

  return (
    <SingleFormWizard
      steps={steps}
      memo={`${app.id}${app.version}`}
      formSubmit={formSubmit}
    />
    // <Wizard
    //   steps={steps}
    //   memo={`${app.id}${app.version}`}
    //   formSubmit={formSubmit}
    // />
  );
};

const JobLauncherWizard: React.FC<JobLauncherWizardProps> = ({
  appId,
  appVersion,
}) => {
  const { data, isLoading, error } = AppsHooks.useDetail(
    { appId, appVersion },
    { refetchOnWindowFocus: false }
  );
  const {
    data: systemsData,
    isLoading: systemsIsLoading,
    error: systemsError,
  } = SystemsHooks.useList(
    {
      select: 'allAttributes',
      listType: Systems.ListTypeEnum.All,
    },
    { refetchOnWindowFocus: false }
  );
  const {
    data: schedulerProfilesData,
    isLoading: schedulerProfilesIsLoading,
    error: schedulerProfilesError,
  } = SystemsHooks.useSchedulerProfiles({ refetchOnWindowFocus: false });
  const app = data?.result;
  const systems = useMemo(() => systemsData?.result ?? [], [systemsData]);
  const schedulerProfiles = useMemo(
    () => schedulerProfilesData?.result ?? [],
    [schedulerProfilesData]
  );
  const defaultValues = useMemo(
    () => generateJobDefaults({ app, systems }),
    [app, systems]
  );

  return (
    <QueryWrapper
      isLoading={isLoading || systemsIsLoading || schedulerProfilesIsLoading}
      error={error || systemsError || schedulerProfilesError}
    >
      {app && (
        <JobLauncherProvider
          value={{ app, systems, defaultValues, schedulerProfiles }}
        >
          <JobLauncherWizardRender jobSteps={jobSteps} />
        </JobLauncherProvider>
      )}
    </QueryWrapper>
  );
};

export default JobLauncherWizard;
