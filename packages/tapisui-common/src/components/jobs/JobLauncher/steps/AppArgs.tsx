import React, { useMemo } from 'react';
import { Apps, Jobs } from '@tapis/tapis-typescript';
import { useJobLauncher } from '../components';
import fieldArrayStyles from '../FieldArray.module.scss';
import { FieldArray, useField, FieldArrayRenderProps } from 'formik';
import { Input } from 'reactstrap';

import {
  FormikInput,
  FormikCheck,
  FormikSelect,
  FormikTapisFile,
} from '../../../../ui-formik/FieldWrapperFormik';
import { getArgMode } from '../../../../utils/jobArgs';
import { JobStep } from '..';
import * as Yup from 'yup';

type NotesType = {
  Optional?: string;
  Info?: string;
  Dropdown?: string[];
  filePath?: string;
};

type ArgFieldProps = {
  index: number;
  name: string;
  argType: string;
  arrayHelpers: FieldArrayRenderProps;
  inputMode?: Apps.ArgInputModeEnum;
  notes?: NotesType;
};

// Helper function to parse parameter and value from arg string
const parseArgValue = (argString: string, parameterName: string): string => {
  // if (argString === undefined || argString === null) {
  //   return '';
  // }
  // Extract value from arg string
  const parameterFlag = `--${parameterName}`;
  if (argString.startsWith(parameterFlag)) {
    return argString.substring(parameterFlag.length).trim();
  }

  return argString;
};

// Component to handle parameter value input with hidden parameter formatting
const HiddenParamInput: React.FC<{
  name: string;
  parameterName: string;
  label: string;
  required: boolean;
  infoText: string;
  labelClassName: string;
  description?: string;
  disabled?: boolean;
}> = ({
  name,
  parameterName,
  label,
  required,
  labelClassName,
  description = '',
  disabled = false,
}) => {
  const [field, meta, helpers] = useField(name);

  // Extract just the value part for display
  const displayValue = parseArgValue(field.value || '', parameterName);

  // Transform input into the complete argument format before storing in Formik state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    const completeArg = newValue.trim() ? `--${parameterName} ${newValue}` : '';
    helpers.setValue(completeArg);
  };

  // Custom validation to show error only when field is required and empty
  const showError = !!(
    meta.error &&
    meta.touched &&
    required &&
    !displayValue.trim()
  );

  return (
    <div className="form-group">
      <label
        className={`${labelClassName || 'form-field__label'} ${
          fieldArrayStyles.nospace
        }`}
        htmlFor={name}
        style={{ display: 'flex', alignItems: 'center', fontSize: 'small' }}
      >
        {label}
        {required && (
          <span className="badge badge-danger" style={{ marginLeft: '10px' }}>
            Required
          </span>
        )}
      </label>
      <Input
        type="text"
        bsSize="sm"
        value={displayValue}
        onChange={handleChange}
        onBlur={field.onBlur}
        disabled={disabled}
        required={required}
        id={name}
        invalid={showError}
      />

      {showError && (
        <div
          className="invalid-feedback d-block"
          style={{ fontStyle: 'italic', fontWeight: 400 }}
        >
          {meta.error}
        </div>
      )}

      {description && !showError && (
        <small
          className="form-text text-muted"
          style={{ fontStyle: 'italic', fontWeight: 400 }}
        >
          {description}
        </small>
      )}
    </div>
  );
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
        <HiddenParamInput
          name={`${name}.arg`}
          parameterName={nameField.value}
          label={descriptionField.value}
          required={false}
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

    case notes?.filePath === 'true':
      return (
        <FormikTapisFile
          name={`${name}.arg`}
          label="Metadata"
          required={false}
          description="Metadata tsv file as a pathname, TAPIS URI or web URL"
        />
      );

    default:
      return (
        <HiddenParamInput
          name={`${name}.arg`}
          parameterName={nameField.value}
          label={descriptionField.value}
          required={true}
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
                  notes={notes}
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

export const assembleArgSpec = (argSpecs: Array<Jobs.JobArgSpec>) => {
  return argSpecs.reduce(
    (previous, current) =>
      `${previous}${current.include ? ` ${current.arg}` : ``}`,
    ''
  );
};

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
