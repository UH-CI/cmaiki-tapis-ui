import React, { useState, useMemo } from "react";
import GenericModal, { useModal } from "../../_common/GenericModal";
import { Button } from "reactstrap";
import { StepWizardChildProps } from "react-step-wizard";
import { WizardStep } from ".";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import styles from "./Wizard.module.scss";

function CombinedStepsContainer<T>({
  steps,
  formSubmit,
}: {
  steps: WizardStep<T>[];
  formSubmit: (values: Partial<T>) => void;
}) {
  const { modal, open, close } = useModal();

  const stepsSansSubmit = steps.filter((step) => step.id !== "jobSubmit");

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

  const jobSubmitStep = useMemo(() => {
    const submitStep = steps.find((step) => step.id === "jobSubmit");
    return submitStep;
  }, [steps]);

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={formSubmit}
        enableReinitialize={true}
      >
        {({ values }) => (
          <Form>
            {stepsSansSubmit.map((step, index) => (
              <div key={index} className={styles.step}>
                {step.render ? step.render : null}
              </div>
            ))}
            <div className={styles["single-form-preview"]}>
              <Button
                color="primary"
                onClick={() => {
                  console.log("Values at preview:", values);
                  open();
                }}
              >
                Preview Job
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      <GenericModal
        isOpen={modal}
        toggle={close}
        title="Preview"
        size="lg"
        body={
          jobSubmitStep ? (
            jobSubmitStep.render
          ) : (
            <p>Job Submit step not found</p>
          )
        }
      />
    </>
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
    </div>
  );
}

export default SingleFormWizard;
