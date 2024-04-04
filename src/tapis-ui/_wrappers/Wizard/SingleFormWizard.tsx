import React, { useMemo, useCallback } from "react";
import GenericModal, { useModal } from "../../_common/GenericModal";
import { Button } from "reactstrap";
import { WizardStep } from ".";
import * as Yup from "yup";
import { Formik, Form, useFormikContext } from "formik";
import styles from "./Wizard.module.scss";

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

type WizardProps<T> = {
  steps: Array<WizardStep<T>>;
  memo?: any; // Typed as any in original Wizard component as well
  formSubmit: (values: Partial<T>) => void;
};

const SingleFormWizard = <T,>({ steps, formSubmit }: WizardProps<T>) => {
  const initialValues = steps.reduce(
    (acc, step) => ({
      ...acc,
      ...(step.initialValues || {}),
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

  const stepsToRemove = [
    "jobSubmit",
    "execution",
    "fileInputArrays",
    "envVariables",
    "schedulerOptions",
  ];
  const simpleFormSteps = steps.filter(
    (step) => !stepsToRemove.includes(step.id)
  );
  const jobSubmissionStep = useMemo(
    () => steps.find((step) => step.id === "jobSubmit"),
    [steps]
  );

  return (
    <div className={styles["single-form-container"]}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={formSubmit}
        enableReinitialize={true}
      >
        {() => (
          <Form>
            {simpleFormSteps.map((step, index) => (
              <div key={index} className={styles.step}>
                {step.render}
              </div>
            ))}
            <FormPreview step={jobSubmissionStep} />
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SingleFormWizard;
