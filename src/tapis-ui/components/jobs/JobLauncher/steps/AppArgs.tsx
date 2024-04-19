import React, { useMemo, useEffect, useState } from "react";
import { Apps, Jobs } from "@tapis/tapis-typescript";
import { useJobLauncher } from "../components";
import fieldArrayStyles from "../FieldArray.module.scss";
import { FieldArray, useField, FieldArrayRenderProps } from "formik";
import { FormikInput } from "tapis-ui/_common";
import { FormikCheck } from "../../../../_common/FieldWrapperFormik";
import { getArgMode } from "tapis-api/utils/jobArgs";
import { JobStep } from "..";
import * as Yup from "yup";

type ArgFieldProps = {
  index: number;
  name: string;
  argType: string;
  arrayHelpers: FieldArrayRenderProps;
  inputMode?: Apps.ArgInputModeEnum;
};

export const ArgField: React.FC<ArgFieldProps> = ({ name, inputMode }) => {
  const [descriptionField] = useField(`${name}.description`);
  const [includeField] = useField(`${name}.include`);

  // State to keep track of whether to show FormikInput or FormikCheck
  const [checkboxInput, setCheckboxInput] = useState(false);

  // Determine on component mount which component to show
  // Checkbox inputs should only render for flags, not commandline arguments
  useEffect(() => {
    setCheckboxInput(includeField.value);
  }, []);

  return (
    <>
      {checkboxInput ? (
        <FormikInput
          name={`${name}.arg`}
          required={true}
          label={descriptionField.value}
          disabled={inputMode === Apps.ArgInputModeEnum.Fixed}
          description=""
          labelClassName={fieldArrayStyles["arg-label"]}
        />
      ) : (
        <FormikCheck
          name={`${name}.include`} // Toggles the include parameter for flag arguments
          required={false}
          label={descriptionField.value}
          disabled={inputMode === Apps.ArgInputModeEnum.Fixed}
          description=""
          labelClassName={fieldArrayStyles["checkbox-label"]}
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
          <div className={fieldArrayStyles["array-group"]}>
            {args.map((arg, index) => {
              // console.log("arg of args: ", arg.arg);
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
    arg: Yup.string().min(1).required("The argument cannot be blank"),
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
    ""
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

// Function to remove the (--arg_name) of the arg while displaying only the value.
// const preprocessAppArgs = (appArgs: any[]) => {
//   return appArgs.map((argSpec) => {
//     const parts = argSpec.arg.split(" ");
//
//     const valueOnly = parts.slice(1).join(" "); // Join back in case the value itself contains spaces.
//
//     return {
//       ...argSpec,
//       arg: valueOnly, // Only the value is kept.
//     };
//   });
// };

const step: JobStep = {
  id: "args",
  name: "Arguments",
  render: <Args />,
  summary: <ArgsSummary />,
  validationSchema,
  generateInitialValues: ({ job }) => ({
    parameterSet: {
      appArgs: job.parameterSet?.appArgs,
      // ? preprocessAppArgs(job.parameterSet.appArgs)
      // : [],
      schedulerOptions: job.parameterSet?.schedulerOptions,
    },
  }),
};

export default step;
