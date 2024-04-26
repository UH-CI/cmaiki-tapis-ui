import React, { useEffect, useMemo } from "react";
import { Apps, Jobs } from "@tapis/tapis-typescript";
import { Button } from "reactstrap";
import { useJobLauncher, StepSummaryField } from "../components";
import styles from "./FileInputs.module.scss";
import fieldArrayStyles from "../FieldArray.module.scss";
import {
  getIncompleteJobInputs,
  getAppInputsIncludedByDefault,
} from "tapis-api/utils/jobFileInputs";
import { FieldArray, useFormikContext, FieldArrayRenderProps } from "formik";
import {
  FormikCheck,
  FormikInput,
  FormikTapisFile,
} from "tapis-ui/_common/FieldWrapperFormik";
import { JobStep } from "..";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";

type FileInputFieldProps = {
  item: Jobs.JobFileInput;
  index: number;
  remove: (index: number) => Jobs.JobFileInput | undefined;
};

const upperCaseFirstLetter = (str: string) => {
  const lower = str.toLowerCase();
  return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
};

const JobInputField: React.FC<FileInputFieldProps> = ({
  item,
  index,
  remove,
}) => {
  const { app } = useJobLauncher();
  const inputMode: Apps.FileInputModeEnum | undefined = useMemo(
    () =>
      app.jobAttributes?.fileInputs?.find(
        (appInput) => appInput.name === item.name
      )?.inputMode ?? undefined,
    /* eslint-disable-next-line */
    [app.id, app.version]
  );
  const isRequired = inputMode === Apps.FileInputModeEnum.Required;
  const note = `${
    inputMode ? upperCaseFirstLetter(inputMode) : "User Defined"
  }`;

  return (
    <div className={fieldArrayStyles["array-item"]}>
      <FormikTapisFile
        name={`fileInputs.${index}.sourceUrl`}
        label="Source URL"
        required={true}
        description="Input TAPIS file as a pathname, TAPIS URI or web URL"
      />
      <div className={fieldArrayStyles["end-container"]}>
        <FormikCheck
          name={`fileInputs.${index}.autoMountLocal`}
          label="Auto-mount Local"
          required={false}
          description="If this is true, the source URL will be mounted from the execution system's local file system"
        />
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
  const { values } = useFormikContext();
  const { app } = useJobLauncher();
  const requiredInputs = useMemo(
    () => getFileInputsOfMode(app, Apps.FileInputModeEnum.Required),
    /* eslint-disable-next-line */
    [app.id, app.version]
  );
  let requiredText =
    requiredInputs.length > 0 ? `Required (${requiredInputs.length})` : "";
  const jobInputs = (values as Partial<Jobs.ReqSubmitJob>)?.fileInputs ?? [];

  // Add an initial item if the list is empty on component mount
  useEffect(() => {
    if (jobInputs.length === 0) {
      arrayHelpers.push({
        sourceUrl: "",
        targetPath: "./reads",
      });
    }
  }, [arrayHelpers]);

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
              sourceUrl: "",
              targetPath: "./reads",
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
          ? `${jobFileInput.name}: ${jobFileInput.sourceUrl}` ??
            jobFileInput.sourceUrl
          : undefined;
        const key =
          // jobFileInput.name ??
          jobFileInput.sourceUrl ?? jobFileInput.targetPath;
        // If this job file input is incomplete, display its name or sourceUrl
        const error = !complete
          ? `${key ?? "A file input"} is missing required information`
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
      // name: Yup.string().min(1).required("A fileInput name is required"),
      sourceUrl: Yup.string().min(1).required("A sourceUrl is required"),
      targetPath: Yup.string().min(1).required("A targetPath is required"),
      autoMountLocal: Yup.boolean(),
    })
  ),
});

const step: JobStep = {
  id: "fileInputs",
  name: "File Inputs",
  render: <FileInputs />,
  summary: <FileInputsSummary />,
  validationSchema,
  generateInitialValues: ({ job }) => ({
    fileInputs: job.fileInputs,
  }),
};

export default step;
