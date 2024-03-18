import React, { useState, useCallback } from "react";
import { StepWizardChildProps } from "react-step-wizard";
import { Button } from "reactstrap";
import { WizardStep } from ".";
import * as Yup from "yup";

import { Formik, Form } from "formik";
import styles from "./Wizard.module.scss";

type WizardControlProps<T> = {
  steps: Array<WizardStep<T>>;
} & Partial<StepWizardChildProps>;

function WizardSummary<T>({
  steps,
  ...stepWizardProps
}: WizardControlProps<T>) {
  const { goToNamedStep } = stepWizardProps;
  const editCallback = useCallback(
    (stepId: string) => goToNamedStep && goToNamedStep(stepId),
    [goToNamedStep]
  );
  return (
    <div className={styles.summary}>
      <h3>Summary</h3>
      {steps.map((step) => (
        <div
          className={styles["step-summary"]}
          key={`wizard-summary-${step.id}`}
        >
          <div className={styles.name}>
            <b>{step.name}</b>
            <Button
              color="link"
              onClick={() => editCallback(step.id)}
              className={styles.edit}
            >
              edit
            </Button>
          </div>
          <div className={styles.content}>{step.summary}</div>
        </div>
      ))}
    </div>
  );
}

function CombinedStepsContainer<T>({
  steps,
  formSubmit,
}: {
  steps: WizardStep<T>[];
  formSubmit: (values: Partial<T>) => void;
}) {
  const initialValues = steps.reduce(
    (acc, step) => ({
      ...acc,
      ...(step.initialValues || {}), // Provide an empty object as default
    }),
    {}
  );

  const validationSchema = Yup.object().shape(
    steps.reduce(
      (acc, step) => ({
        ...acc,
        ...(step.validationSchema ? step.validationSchema.fields : {}),
      }),
      {}
    )
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={formSubmit}
      enableReinitialize={true}
    >
      <Form>
        {steps.map((step, index) => (
          <div key={index} className={styles.step}>
            {step.render ? step.render : null}
          </div>
        ))}
        {/*TODO why is this button essential to hotreloading of the form preview?*/}
        <button type="submit">Why is this button necessary???</button>
      </Form>
    </Formik>
  );
}

type WizardProps<T> = {
  steps: Array<WizardStep<T>>;
  memo?: any;
  formSubmit: (values: Partial<T>) => void;
};

function SingleFormWizard<T>({ steps, memo, formSubmit }: WizardProps<T>) {
  const [stepWizardProps, setStepWizardProps] = useState<
    Partial<StepWizardChildProps>
  >({});
  return (
    <div className={styles["single-form-container"]}>
      <CombinedStepsContainer steps={steps} formSubmit={formSubmit} />
      {/*<WizardSummary steps={steps} {...stepWizardProps} />*/}
    </div>
  );
}

export default SingleFormWizard;
