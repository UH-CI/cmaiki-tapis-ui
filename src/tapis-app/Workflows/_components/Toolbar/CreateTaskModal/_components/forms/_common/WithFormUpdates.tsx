import { useFormikContext } from 'formik';
import React, { useEffect } from 'react';
import * as Yup from 'yup';
import { useImageBuildTaskContext } from '../ImageBuildTask/ImageBuildTask';

export type State = any;

type RetType = {
  state: State;
  validationSchema: Yup.AnyObjectSchema;
};

export type ValidationSchema = Partial<Yup.AnyObjectSchema>;

export type Mutator = (
  state: State,
  validationSchema: ValidationSchema
) => RetType;

type Before = Mutator;
type After = Mutator;

type WithFormUpdateProps = React.PropsWithChildren<{}> & {
  update: Before;
  remove: After;
};

const WithFormUpdates: React.FC<WithFormUpdateProps> = ({
  children,
  update,
  remove,
}) => {
  const mutators = {
    update,
    remove,
  };
  const mutate = (
    type: 'update' | 'remove',
    state: object,
    validationSchema: Partial<Yup.AnyObjectSchema>
  ) => {
    let { state: modifiedState, validationSchema: modifiedValidationSchema } =
      mutators[type](state, validationSchema);
    context.setInitialValues(modifiedState);
    context.setValidationSchema(modifiedValidationSchema);
  };

  const { context } = useImageBuildTaskContext();
  const { values } = useFormikContext();

  useEffect(() => {
    let state = JSON.parse(JSON.stringify(values)); // Deep copy
    mutate('update', state, context.validationSchema);
    return () => {
      mutate('remove', state, context.validationSchema);
    };
  }, []);
  return <>{children}</>;
};

export default WithFormUpdates;
