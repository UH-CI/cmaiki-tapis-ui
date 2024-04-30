import React, { useMemo, useState } from "react";
import { Jobs } from "@tapis/tapis-typescript";
import { useJobLauncher, StepSummaryField } from "../components";
import fieldArrayStyles from "../FieldArray.module.scss";
import { Collapse } from "tapis-ui/_common";
import { useFormikContext } from "formik";
import {
  FormikCheck,
  FormikTapisFile,
  FormikSelect,
} from "tapis-ui/_common/FieldWrapperFormik";
import * as Yup from "yup";
import { JobStep } from "..";

const ArchiveOptions: React.FC = () => {
  const { systems } = useJobLauncher();
  const { values } = useFormikContext();
  const [isOpen, setIsOpen] = useState(false);

  const archiveSystemId = useMemo(
    () =>
      ((values as Partial<Jobs.ReqSubmitJob>) || "test-zip-koa-hpc-andyyu")
        .archiveSystemId,
    [values]
  );

  return (
    <Collapse
      title="Archive Options"
      open={isOpen}
      isCollapsable={true}
      className={fieldArrayStyles.item}
    >
      <div className={fieldArrayStyles.item}>
        <FormikSelect
          name="archiveSystemId"
          label="Archive System ID"
          description="If selected, this system ID will be used for job archiving instead of the execution system default"
          required={false}
        >
          <option value={undefined}></option>
          <option value={"Something test"}>Something Test</option>
          {systems.map((system) => (
            <option
              value={system.id}
              key={`archive-system-select-${system.id}`}
            >
              {system.id}
            </option>
          ))}
        </FormikSelect>
        <FormikTapisFile
          allowSystemChange={false}
          systemId={archiveSystemId}
          disabled={!archiveSystemId}
          name="archiveSystemDir"
          label="Archive System Directory"
          description="The directory on the selected system in which to place archived files"
          required={false}
          files={false}
          dirs={true}
        />
        <div className={fieldArrayStyles.checksContainer}>
          <div className={fieldArrayStyles.checkItem}>
            <FormikCheck
              name="archiveOnAppError"
              label="Archive On App Error"
              description="If checked, the job will be archived even if there is an execution error"
              required={false}
            />
          </div>
          <div className={fieldArrayStyles.checkItem}>
            <FormikCheck
              name="parameterSet.archiveFilter.includeLaunchFiles"
              label="Include Launch Files"
              description="If checked, launch files will be included during job archiving"
              required={false}
            />
          </div>
        </div>
      </div>
    </Collapse>
  );
};

export const Archive: React.FC = () => {
  return <ArchiveOptions />;
};

export const ArchiveSummary: React.FC = () => {
  const { job } = useJobLauncher();
  const { archiveSystemId, archiveSystemDir, archiveOnAppError } = job;

  return (
    <div>
      <StepSummaryField
        field={`Archive System ID: ${archiveSystemId ?? "default"}`}
        key={`archive-system-id-summary`}
      />
      <StepSummaryField
        field={`Archive System Directory: ${archiveSystemDir ?? "default"}`}
        key={`archive-system-dir-summary`}
      />
      <StepSummaryField
        field={`Archive On App Error: ${archiveOnAppError}`}
        key={`archive-on-app-error-summary`}
      />
    </div>
  );
};

const validationSchema = Yup.object().shape({
  archiveOnAppError: Yup.boolean(),
  archiveSystemId: Yup.string(),
  archiveSystemDir: Yup.string(),
  parameterSet: Yup.object({
    archiveFilter: Yup.object({
      includes: Yup.array(
        Yup.string()
          .min(1)
          .required("A pattern must be specified for this include")
      ),
      excludes: Yup.array(
        Yup.string()
          .min(1)
          .required("A pattern must be specified for this exclude")
      ),
      includeLaunchFiles: Yup.boolean(),
    }),
  }),
});

const step: JobStep = {
  id: "archiving",
  name: "Archiving",
  render: <Archive />,
  summary: <ArchiveSummary />,
  validationSchema,
  generateInitialValues: ({ job }) => ({
    // Default to archive on app error
    archiveOnAppError: true,
    // archiveOnAppError: job.archiveOnAppError,
    archiveSystemId: job.archiveSystemId,
    archiveSystemDir: job.archiveSystemDir,
    parameterSet: {
      archiveFilter: job.parameterSet?.archiveFilter,
    },
  }),
};

export default step;
