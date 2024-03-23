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

function CombinedStepsContainer<T>({
  steps,
}: {
  steps: WizardStep<T>[];
  formSubmit: (values: Partial<T>) => void;
}) {
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
  console.log("simpleFormSteps ", simpleFormSteps);
  const jobSubmissionStep = useMemo(
    () => steps.find((step) => step.id === "jobSubmit"),
    [steps]
  );
  return (
    <Form>
      {simpleFormSteps?.map((step, index) => (
        <div key={index} className={styles.step}>
          {step.render ? step.render : null}
        </div>
      ))}
      <FormPreview step={jobSubmissionStep} />
    </Form>
  );
}

type WizardProps<T> = {
  steps: Array<WizardStep<T>>;
  // Typed as any in original Wizard component as well
  memo?: any;
  formSubmit: (values: Partial<T>) => void;
};

function SingleFormWizard<T>({ steps, formSubmit }: WizardProps<T>) {
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

  return (
    <div className={styles["single-form-container"]}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={formSubmit}
        enableReinitialize={true}
      >
        <CombinedStepsContainer<T> steps={steps} formSubmit={formSubmit} />
      </Formik>
    </div>
  );
}

export default SingleFormWizard;
