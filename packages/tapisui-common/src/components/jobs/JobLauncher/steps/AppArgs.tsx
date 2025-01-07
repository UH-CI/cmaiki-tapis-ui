import React, { useMemo } from 'react';
import { Apps, Jobs } from '@tapis/tapis-typescript';
import { useJobLauncher } from '../components';
import fieldArrayStyles from '../FieldArray.module.scss';
import { FieldArray, useField, FieldArrayRenderProps } from 'formik';

import {
  FormikInput,
  FormikCheck,
  FormikSelect,
} from '../../../../ui-formik/FieldWrapperFormik';
// import { getArgMode } from "tapis-api/utils/jobArgs";
import { getArgMode } from '../../../../utils/jobArgs';
import { JobStep } from '..';
import * as Yup from 'yup';

type NotesType = {
  Optional?: string;
  Info?: string;
  Dropdown?: string[];
};

type ArgFieldProps = {
  index: number;
  name: string;
  argType: string;
  arrayHelpers: FieldArrayRenderProps;
  inputMode?: Apps.ArgInputModeEnum;
  notes?: NotesType;
};

export const ArgField: React.FC<ArgFieldProps> = ({
  name,
  inputMode,
  notes,
}) => {
  const [nameField] = useField(`${name}.name`);
  const [descriptionField] = useField(`${name}.description`);

  switch (true) {
    case Array.isArray(notes?.Dropdown) && (notes?.Dropdown.length ?? 0) > 0:
      return (
        <FormikSelect
          name={`${name}.arg`}
          label={descriptionField.value}
          required={true}
          description=""
          infoText={notes?.Info || ''}
          labelClassName={fieldArrayStyles['arg-label']}
          style={{
            backgroundColor: '#fbfdff',
            border: '2px solid #e8f3fe',
            borderRadius: '4px',
            color: '#333',
            position: 'relative',
          }}
        >
          {notes?.Dropdown?.map((option) => (
            <option label={option} key={option}>
              {option}
            </option>
          ))}
        </FormikSelect>
      );

    case notes?.Optional === 'true':
      return (
        <FormikInput
          name={`${name}.arg`}
          required={false}
          label={descriptionField.value}
          disabled={false}
          description=""
          infoText={notes?.Info || ''}
          labelClassName={fieldArrayStyles['arg-label']}
        />
      );

    case inputMode === Apps.ArgInputModeEnum.IncludeOnDemand ||
      inputMode === Apps.ArgInputModeEnum.IncludeByDefault:
      return (
        <FormikCheck
          name={`${name}.include`}
          required={false}
          label={nameField.value}
          description=""
          infoText={notes?.Info || ''}
          labelClassName={fieldArrayStyles['checkbox-label']}
          tooltipText={descriptionField.value}
        />
      );

    case inputMode === Apps.ArgInputModeEnum.Fixed:
      return (
        <FormikInput
          name={`${name}.arg`}
          required={true}
          label={descriptionField.value}
          disabled={true}
          description=""
          infoText={notes?.Info || ''}
          labelClassName={fieldArrayStyles['arg-label']}
        />
      );

    default:
      return (
        <FormikInput
          name={`${name}.arg`}
          required={true}
          label={descriptionField.value}
          disabled={false}
          description=""
          infoText={notes?.Info || ''}
          labelClassName={fieldArrayStyles['arg-label']}
        />
      );
  }
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
              // Get the matching appArgSpec for this argument by name
              const argSpec = argSpecs.find((spec) => spec.name === arg.name);
              const notes = argSpec?.notes ?? {};

              return (
                <ArgField
                  key={`${name}-${index}`}
                  index={index}
                  arrayHelpers={arrayHelpers}
                  name={`${name}.${index}`}
                  argType={argType}
                  inputMode={inputMode}
                  notes={notes} // Pass notes object to ArgField
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
