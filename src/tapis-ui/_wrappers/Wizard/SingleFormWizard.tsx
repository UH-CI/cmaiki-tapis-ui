import React, { useMemo, useCallback } from "react";
import GenericModal, { useModal } from "../../_common/GenericModal";
import { Button } from "reactstrap";
import { WizardStep } from ".";
import { Formik, Form, useFormikContext } from "formik";
import styles from "./Wizard.module.scss";
import { StepWizardChildProps } from "react-step-wizard";
import * as Yup from "yup";

interface FormPreviewProps<T> {
  step?: WizardStep<T>;
}

export const FormPreview = <T,>({ step }: FormPreviewProps<T>) => {
  const { validateForm, handleSubmit } = useFormikContext();
  const { modal, open, close } = useModal();

  const onPreview = useCallback(async () => {
    try {
      const errors = await validateForm();
      if (!Object.keys(errors).length) {
        // Necessary for updating steps with latest Formik values
        handleSubmit && handleSubmit();
        open();
      }
    } catch (error) {
      console.error("An error occurred during form validation:", error);
    }
  }, [validateForm, handleSubmit, open]);

  return (
    <>
      <div className={styles["single-form-preview"]}>
        <Button color="primary" onClick={onPreview}>
          Preview Job
        </Button>
      </div>
      <GenericModal
        isOpen={modal}
        toggle={close}
        title="Preview"
        size="lg"
        body={step ? step.render : <p>Preview not found</p>}
      />
    </>
  );
};

type StepContainerProps<T> = {
  step: WizardStep<T>;
  formSubmit: (values: Partial<T>) => void;
} & Partial<StepWizardChildProps>;

function StepContainer<T>({ step, formSubmit }: StepContainerProps<T>) {
  const { initialValues, validate } = step;
  const validationSchema = Yup.object().shape(
    step.validationSchema ? step.validationSchema.fields : {}
  );
  const jobSubmissionStep = step.id === "jobSubmit";

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      validate={validate}
      onSubmit={formSubmit}
      enableReinitialize={true}
    >
      <Form>
        {jobSubmissionStep ? (
          <div className={styles.submit}>
            <FormPreview step={step} />
          </div>
        ) : (
          <div className={styles.step}>{step.render}</div>
        )}
      </Form>
    </Formik>
  );
}

type WizardProps<T> = {
  steps: Array<WizardStep<T>>;
  memo?: any; // Typed as any in original Wizard component as well
  formSubmit: (values: Partial<T>) => void;
};

const SingleFormWizard = <T,>({ steps, formSubmit }: WizardProps<T>) => {
  const filteredSteps = useMemo(
    () =>
      steps.filter(
        (step) =>
          ![
            "execution",
            "fileInputArrays",
            "envVariables",
            "schedulerOptions",
          ].includes(step.id)
      ),
    [steps]
  );

  return (
    <div className={styles["single-form-container"]}>
      {filteredSteps.map((step) => (
        <StepContainer<T>
          step={step}
          key={`wizard-step-${step.id}`}
          stepName={step.id}
          formSubmit={formSubmit}
        />
      ))}
    </div>
  );
};

export default SingleFormWizard;
