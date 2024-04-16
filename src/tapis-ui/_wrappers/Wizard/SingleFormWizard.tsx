import React, { useMemo, useCallback, useEffect, useState } from "react";
import GenericModal, { useModal } from "../../_common/GenericModal";
import { Button } from "reactstrap";
import { WizardStep } from ".";
import { Formik, Form, useFormikContext, FormikErrors } from "formik";
import styles from "./Wizard.module.scss";
import * as Yup from "yup";

// TODO Add stricter typing, replace any
interface FormValues {
  [key: string]: any;
}

type FormikObserverProps = {
  onChange: (field: string, value: any) => void;
};

// Tracks and updates Formik state across steps
// Necessary to display all steps on a single page and still render them each to populate with
// Default app arguments
const FormikObserver: React.FC<FormikObserverProps> = ({ onChange }) => {
  const { values } = useFormikContext<FormValues>();

  useEffect(() => {
    Object.entries(values).forEach(([field, value]) => {
      onChange(field, value);
    });
  }, [values, onChange]);

  return null;
};

type StepContainerProps<T> = {
  step: WizardStep<T>;
  onFieldChange: (field: string, value: any) => void;
};

function StepContainer<T>({ step, onFieldChange }: StepContainerProps<T>) {
  const { initialValues, validate } = step;
  const validationSchema = Yup.object().shape(
    step.validationSchema ? step.validationSchema.fields : {}
  );

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      validate={validate}
      onSubmit={(values) => {}} // Form submission handled at parent Formik component
      enableReinitialize={true}
    >
      {({ values }) => (
        <Form>
          <div className={styles.step}>{step.render}</div>
          <FormikObserver onChange={onFieldChange} />
        </Form>
      )}
    </Formik>
  );
}

interface FormPreviewProps<T> {
  step?: WizardStep<T>;
  validateForm: () => Promise<FormikErrors<T>>;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

export const FormPreview = <T,>({
  step,
  validateForm,
  handleSubmit,
}: FormPreviewProps<T>) => {
  const { modal, open, close } = useModal();

  const onPreview = useCallback(async () => {
    try {
      const errors = await validateForm();
      if (!Object.keys(errors).length) {
        handleSubmit();
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
  const [formValues, setFormValues] = useState<Partial<T>>({});

  // Hide these steps from users, should be defined in app creation
  const filteredSteps = useMemo(
    () =>
      steps.filter(
        (step) =>
          ![
            "jobSubmit",
            "execution",
            "fileInputArrays",
            "envVariables",
            "schedulerOptions",
          ].includes(step.id)
      ),
    [steps]
  );

  // Part of structure to update Formik state upon form changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    formSubmit(formValues);
  }, [formValues, formSubmit]);

  // Find FormSubmit step to render job preview/submission step separately as a modal
  const previewStep = useMemo(
    () => steps.find((step) => step.id === "jobSubmit"),
    [steps]
  );

  return (
    <Formik
      initialValues={formValues}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ validateForm, handleSubmit }) => (
        <Form>
          <div className={styles["single-form-container"]}>
            {filteredSteps.map((step) => (
              <StepContainer<T>
                key={`wizard-step-${step.id}`}
                step={step}
                onFieldChange={handleFieldChange}
              />
            ))}
            {previewStep && (
              <div className={styles["form-preview"]}>
                <FormPreview
                  step={previewStep}
                  validateForm={validateForm}
                  handleSubmit={handleSubmit}
                />
              </div>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SingleFormWizard;
