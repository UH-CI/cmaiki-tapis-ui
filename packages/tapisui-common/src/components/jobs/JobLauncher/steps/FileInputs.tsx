import React, { useMemo, useEffect, useRef } from 'react';
import { Apps, Jobs } from '@tapis/tapis-typescript';
// import FieldWrapper from '../../../../ui/FieldWrapper';
// import { Input } from 'reactstrap';
import { Button } from 'reactstrap';
import { useJobLauncher, StepSummaryField } from '../components';
// import styles from './FileInputs.module.scss';
import fieldArrayStyles from '../FieldArray.module.scss';
import {
  // generateFileInputFromAppInput,
  getIncompleteJobInputs,
  getAppInputsIncludedByDefault,
} from '../../../../utils/jobFileInputs';
// import { Collapse } from '../../../../ui';
import { FieldArray, useFormikContext, FieldArrayRenderProps } from 'formik';
import {
  // FormikInput,
  // FormikCheck,
  FormikTapisFile,
} from '../../../../ui-formik/FieldWrapperFormik';
import { JobStep } from '..';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';

const APPS_WITHOUT_METADATA = new Set(['demux-app-uhhpc']);

type FileInputFieldProps = {
  item: Jobs.JobFileInput;
  index: number;
  remove: (index: number) => Jobs.JobFileInput | undefined;
};

// const upperCaseFirstLetter = (str: string) => {
//   const lower = str.toLowerCase();
//   return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
// };

const JobInputField: React.FC<FileInputFieldProps> = ({
  item,
  index,
  remove,
}) => {
  const { app } = useJobLauncher();
  const { setFieldValue } = useFormikContext();
  const { name, sourceUrl } = item;

  // Extract file name from sourceUrl and set as targetPath (only for metadata input at index 1)
  useEffect(() => {
    if (index === 1 && sourceUrl) {
      // Extract the last part of the path (directory name)
      const pathParts = sourceUrl.split('/').filter((part) => part.length > 0);
      const filename = pathParts[pathParts.length - 1];

      if (filename) {
        setFieldValue(
          `fileInputs.${index}.targetPath`,
          `./metadata/${filename}`
        );
      }
    }
  }, [sourceUrl, index, setFieldValue]);

  const inputMode: Apps.FileInputModeEnum | undefined = useMemo(
    () =>
      app.jobAttributes?.fileInputs?.find(
        (appInput) => appInput.name === item.name
      )?.inputMode ?? undefined,
    /* eslint-disable-next-line */
    [app.id, app.version]
  );

  // For apps without metadata, only index 0 is required
  // For apps with metadata, index 0 and 1 are required
  const isRequired =
    inputMode === Apps.FileInputModeEnum.Required ||
    (APPS_WITHOUT_METADATA.has(app.id ?? '') ? index < 1 : index < 2);

  // const note = `${
  //   inputMode ? upperCaseFirstLetter(inputMode) : 'User Defined'
  // }`;

  return (
    <div className={fieldArrayStyles['array-item']}>
      <FormikTapisFile
        name={`fileInputs.${index}.sourceUrl`}
        label={
          index === 0
            ? 'Reads Directory Source URL'
            : index === 1
            ? 'Metadata File Source URL'
            : 'Source URL'
        }
        required={true}
        description="The Source URL"
        // description="Select path to DIRECTORY CONTAINING desired files. Not the files themselves."
      />
      <div className={fieldArrayStyles['end-container']}>
        {!isRequired && (
          <Button onClick={() => remove(index)} size="sm" color="danger">
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

const getFileInputsOfMode = (
  app: Apps.TapisApp,
  inputMode: Apps.FileInputModeEnum
) =>
  app.jobAttributes?.fileInputs?.filter(
    (appInput) => appInput.inputMode === inputMode
  ) ?? [];

const JobInputs: React.FC<{ arrayHelpers: FieldArrayRenderProps }> = ({
  arrayHelpers,
}) => {
  const { values, setFieldValue } = useFormikContext();
  const { app } = useJobLauncher();
  const requiredInputs = useMemo(
    () => getFileInputsOfMode(app, Apps.FileInputModeEnum.Required),
    /* eslint-disable-next-line */
    [app.id, app.version]
  );
  let requiredText =
    requiredInputs.length > 0 ? `Required (${requiredInputs.length})` : '';
  const jobInputs = (values as Partial<Jobs.ReqSubmitJob>)?.fileInputs ?? [];

  // Auto-set archiveSystemDir based on first fileInput sourceUrl
  useEffect(() => {
    if (jobInputs.length > 0 && jobInputs[0].sourceUrl) {
      const sourceUrl = jobInputs[0].sourceUrl;

      // Parse tapis://cmaiki-v2-koa-hpc-Project_A/raw_data/...
      const tapisUrlRegex = /^tapis:\/\/cmaiki-v2-koa-hpc-([^\/]+)/;
      const match = sourceUrl.match(tapisUrlRegex);

      if (match && match[1]) {
        const projectName = match[1];
        const newArchiveDir = `/${projectName}/jobs/\${JobUUID}`;
        setFieldValue('archiveSystemDir', newArchiveDir);
      }
    }
  }, [jobInputs, setFieldValue]);

  // Add an initial item if the list is empty on component mount
  const hasInitialized = useRef(false); // Declare useRef at the top level

  useEffect(() => {
    // Add an initial item only if it hasn't been added before
    if (!hasInitialized.current) {
      if (jobInputs.length === 0) {
        // Always add reads input
        arrayHelpers.push({
          sourceUrl: '',
          targetPath: './reads',
        });

        // Only add metadata input if app requires it
        if (!APPS_WITHOUT_METADATA.has(app.id ?? '')) {
          arrayHelpers.push({
            sourceUrl: '',
            targetPath: '',
          });
        }
      }
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (jobInputs.length === 0) {
  //     arrayHelpers.push({
  //       sourceUrl: '',
  //       targetPath: './reads',
  //     });
  //   }
  // }, []);

  return (
    <>
      <div className={fieldArrayStyles.array}>
        <div className={fieldArrayStyles.header}>
          <h3>File Inputs</h3>
          <span className={fieldArrayStyles.counter}>
            {jobInputs.length} Files
          </span>
        </div>
        <div className={fieldArrayStyles.description}>
          These File Inputs will be submitted with your job.
        </div>
        {jobInputs.map((jobInput, index) => (
          <JobInputField
            key={`fileInputs.${index}`}
            item={jobInput}
            index={index}
            remove={arrayHelpers.remove}
          />
        ))}
        <Button
          onClick={() =>
            arrayHelpers.push({
              sourceUrl: '',
              targetPath: './reads',
            })
          }
          size="sm"
        >
          + Add File Input
        </Button>
      </div>
    </>
  );
};

export const FileInputs: React.FC = () => {
  return (
    <div>
      {/*<h2>File Inputs</h2>*/}
      <FieldArray
        name="fileInputs"
        render={(arrayHelpers) => {
          return (
            <>
              <JobInputs arrayHelpers={arrayHelpers} />
              {/*<OptionalInputs arrayHelpers={arrayHelpers} />*/}
              {/*<FixedInputs />*/}
            </>
          );
        }}
      />
    </div>
  );
};

export const FileInputsSummary: React.FC = () => {
  const { job, app } = useJobLauncher();
  const jobFileInputs = job.fileInputs ?? [];
  const appFileInputs = app.jobAttributes?.fileInputs ?? [];
  const missingRequiredInputs = appFileInputs.filter(
    (appFileInput) =>
      appFileInput.inputMode === Apps.FileInputModeEnum.Required &&
      !jobFileInputs.some(
        (jobFileInput) => jobFileInput.name === appFileInput.name
      )
  );
  const incompleteJobInputs = getIncompleteJobInputs(
    appFileInputs,
    jobFileInputs
  );
  const includedByDefault = getAppInputsIncludedByDefault(
    appFileInputs,
    jobFileInputs
  );
  return (
    <div key="file-inputs-summary">
      {jobFileInputs.map((jobFileInput) => {
        const complete = !incompleteJobInputs.some(
          (incompleteInput) => incompleteInput.name === jobFileInput.name
        );
        // If this job file input is complete, display its name or sourceUrl
        const field = complete
          ? jobFileInput.name
            ? `${jobFileInput.name}: ${jobFileInput.sourceUrl}`
            : jobFileInput.sourceUrl
          : undefined;
        const key =
          jobFileInput.name ??
          jobFileInput.sourceUrl ??
          jobFileInput.targetPath;
        // If this job file input is incomplete, display its name or sourceUrl
        const error = !complete
          ? `${key ?? 'A file input'} is missing required information`
          : undefined;
        return (
          <StepSummaryField
            field={field}
            error={error}
            key={`file-inputs-summary-${key ?? uuidv4()}`}
          />
        );
      })}
      {missingRequiredInputs.map((requiredFileInput) => (
        <StepSummaryField
          error={`${requiredFileInput.name} is required`}
          key={`file-inputs-required-error-${requiredFileInput.name}`}
        />
      ))}
      {includedByDefault.map((defaultInput) => (
        <StepSummaryField
          field={`${defaultInput.name} included by default`}
          key={`file-inputs-default-${defaultInput.name}`}
        />
      ))}
    </div>
  );
};

const validationSchema = Yup.object().shape({
  fileInputs: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().min(1).required('A fileInput name is required'),
      sourceUrl: Yup.string().min(1).required('A sourceUrl is required'),
      targetPath: Yup.string().min(1).required('A targetPath is required'),
      autoMountLocal: Yup.boolean(),
    })
  ),
});

const step: JobStep = {
  id: 'fileInputs',
  name: 'File Inputs',
  render: <FileInputs />,
  summary: <FileInputsSummary />,
  validationSchema,
  generateInitialValues: ({ job }) => ({
    fileInputs: job.fileInputs,
  }),
};

export default step;
