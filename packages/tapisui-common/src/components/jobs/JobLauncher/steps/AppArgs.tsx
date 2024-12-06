import React, { useMemo } from 'react';
import { Apps, Jobs } from '@tapis/tapis-typescript';
import { useJobLauncher } from '../components';
import fieldArrayStyles from '../FieldArray.module.scss';
import { FieldArray, useField, FieldArrayRenderProps } from 'formik';
// import { FormikInput } from "tapis-ui/_common";
// import { FormikInput } from "@tapis/tapisui-common";
// import { FormikCheck } from "../../../../_common/FieldWrapperFormik";
import {
  FormikInput,
  FormikCheck,
} from '../../../../ui-formik/FieldWrapperFormik';
// import { getArgMode } from "tapis-api/utils/jobArgs";
import { getArgMode } from '../../../../utils/jobArgs';
import { JobStep } from '..';
import * as Yup from 'yup';

type ArgFieldProps = {
  index: number;
  name: string;
  argType: string;
  arrayHelpers: FieldArrayRenderProps;
  inputMode?: Apps.ArgInputModeEnum;
  notes?: object;
};

export const ArgField: React.FC<ArgFieldProps> = ({
  name,
  inputMode,
  notes,
}) => {
  const [nameField] = useField(`${name}.name`);
  const [descriptionField] = useField(`${name}.description`);
  const [notesField] = useField(`${name}.notes`);

  console.log(
    `Entire arg object for ${name}:`,
    JSON.stringify(nameField.value, null, 2)
  );
  console.log(`Notes for ${name}:`, notesField);
  console.log(`Notes: ${notes}`);

  return (
    <>
      {inputMode === Apps.ArgInputModeEnum.IncludeOnDemand ||
      inputMode === Apps.ArgInputModeEnum.IncludeByDefault ? (
        <FormikCheck
          name={`${name}.include`} // Toggles the include parameter for flag arguments
          required={false}
          label={nameField.value}
          description=""
          labelClassName={fieldArrayStyles['checkbox-label']}
          tooltipText={descriptionField.value}
        />
      ) : (
        <FormikInput
          name={`${name}.arg`}
          required={true}
          label={descriptionField.value}
          disabled={inputMode === Apps.ArgInputModeEnum.Fixed}
          description=""
          labelClassName={fieldArrayStyles['arg-label']}
        />
      )}
    </>
  );
};

type ArgsFieldArrayProps = {
  argSpecs: Array<Apps.AppArgSpec>;
  name: string;
  argType: string;
};

export const ArgsFieldArray: React.FC<ArgsFieldArrayProps> = ({
  argSpecs,
  name,
  argType,
}) => {
  const [field] = useField(name);
  const args = useMemo(
    () => (field.value as Array<Jobs.JobArgSpec>) ?? [],
    [field]
  );
  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <div className={fieldArrayStyles.array}>
          <div className={fieldArrayStyles.header}>
            <h3>{`${argType}s`}</h3>
            <span className={fieldArrayStyles.counter}>
              {args.length} Arguments
            </span>
          </div>
          <div className={fieldArrayStyles.description}>
            These App Arguments define the parameters of the application.
          </div>
          <div className={fieldArrayStyles['array-group']}>
            {args.map((arg, index) => {
              const inputMode = arg.name
                ? getArgMode(arg.name, argSpecs)
                : undefined;
              return (
                <ArgField
                  key={`${name}-${index}`}
                  index={index}
                  arrayHelpers={arrayHelpers}
                  name={`${name}.${index}`}
                  argType={argType}
                  inputMode={inputMode}
                />
              );
            })}
          </div>
        </div>
      )}
    />
  );
};

export const argsSchema = Yup.array(
  Yup.object({
    name: Yup.string(),
    description: Yup.string(),
    include: Yup.boolean(),
    arg: Yup.string().min(1).required('The argument cannot be blank'),
  })
);

export const Args: React.FC = () => {
  const { app } = useJobLauncher();

  const appArgSpecs = useMemo(
    () => app.jobAttributes?.parameterSet?.appArgs ?? [],
    [app]
  );

  return (
    <div>
      <ArgsFieldArray
        name="parameterSet.appArgs"
        argType="App Argument"
        argSpecs={appArgSpecs}
      />
    </div>
  );
};

export const assembleArgSpec = (argSpecs: Array<Jobs.JobArgSpec>) =>
  argSpecs.reduce(
    (previous, current) =>
      `${previous}${current.include ? ` ${current.arg}` : ``}`,
    ''
  );

export const ArgsSummary: React.FC = () => {
  return null;
};

const validationSchema = Yup.object().shape({
  parameterSet: Yup.object({
    appArgs: argsSchema,
    containerArgs: argsSchema,
    scheduleOptions: argsSchema,
  }),
});

const step: JobStep = {
  id: 'args',
  name: 'Arguments',
  render: <Args />,
  summary: <ArgsSummary />,
  validationSchema,
  generateInitialValues: ({ job }) => ({
    parameterSet: {
      appArgs: job.parameterSet?.appArgs,
      schedulerOptions: job.parameterSet?.schedulerOptions,
    },
  }),
};

export default step;
