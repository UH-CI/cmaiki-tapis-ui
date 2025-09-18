import React, { useState, useMemo, useCallback } from 'react';
import { Formik } from 'formik';
import { Button } from '@mui/material';
import styles from './MetadataForm.module.scss';
import { FormikInput } from '@tapis/tapisui-common';
import METADATA_SCHEMA from './cmaiki_metadata_schema.json';
import {
  type MetadataFieldDef,
  type MetadataSchema,
  type MultiSampleMetadata,
  getSetWideFields,
  getSampleFields,
  createMultiSampleValidationSchema,
  downloadMetadataCSV,
  shouldShowField,
} from './metadataUtils';
import { useSampleData } from './hooks/useSampleData';
import { SampleDataGrid } from './components/SampleDataGrid';

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
  formValues: { [key: string]: string };
}

const SampleSetFields: React.FC<SampleSetFieldsProps> = ({
  setFields,
  formValues,
}) => {
  return (
    <div className={styles['main-form-container']}>
      <div className={styles['fields-grid']}>
        {setFields
          .filter((field) => shouldShowField(field, formValues))
          .map((field) => {
            return (
              <div key={field.field_id} className={styles['field-column']}>
                <FormikInput
                  name={field.field_id}
                  label={field.field_name}
                  required={field.required}
                  description={field.example ? `Example: ${field.example}` : ''}
                  infoText={field.definition}
                  labelClassName={styles['arg-label']}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

const metadataSchema = METADATA_SCHEMA as MetadataSchema;
const metadataFields = metadataSchema.fields;
const setFields = getSetWideFields(metadataFields);
const sampleFields = getSampleFields(metadataFields);
const initialValues = setFields.reduce(
  (acc, field) => ({ ...acc, [field.field_id]: '' }),
  {}
);
const validationSchema = createMultiSampleValidationSchema(
  setFields,
  sampleFields,
  metadataSchema
);

const MetadataForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    samples,
    selectedRows,
    setSelectedRows,
    copiedRowData,
    handleSampleChange,
    handleCopyRow,
    handlePasteToRows,
    handleClearRows,
    samplesWithData,
    filledSampleCount,
    rows,
  } = useSampleData({ sampleFields });

  const validateSamples = useCallback(
    (samples: any[]) => {
      const requiredFields = sampleFields.filter((field) => field.required);
      let errorCount = 0;

      samples.forEach((sample) => {
        const hasData = Object.values(sample).some(
          (value) => typeof value === 'string' && value?.trim()
        );
        if (hasData) {
          requiredFields.forEach((field) => {
            const fieldValue = sample[field.field_id];
            if (
              !fieldValue ||
              (typeof fieldValue === 'string' && !fieldValue.trim())
            ) {
              errorCount++;
            }
          });
        }
      });

      return { isValid: errorCount === 0, errorCount };
    },
    [sampleFields]
  );

  const validation = useMemo(
    () => validateSamples(samplesWithData),
    [samplesWithData, validateSamples]
  );

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const setWideFields = setFields.reduce(
        (acc, field) => ({
          ...acc,
          [field.field_id]: values[field.field_id] || '',
        }),
        {}
      );

      const multiSampleData: MultiSampleMetadata = {
        setWideFields,
        samples: samplesWithData,
      };

      downloadMetadataCSV(multiSampleData, setFields, sampleFields);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['container']}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, setFieldValue, validateForm }) => {
          // Enhanced wrapped sample change handler that triggers validation
          const wrappedHandleSampleChange = useCallback(
            (rowIndex: number, fieldId: string, value: string) => {
              handleSampleChange(rowIndex, fieldId, value);
              validateForm();
            },
            [handleSampleChange, validateForm]
          );

          // Simple validation logic
          const formErrorCount = Object.keys(errors).filter(
            (field) => field !== 'samples'
          ).length;
          const hasFormErrors = formErrorCount > 0;
          const totalErrorCount = validation.errorCount + formErrorCount;
          const isFormValid = validation.isValid && !hasFormErrors;

          return (
            <div className={styles['form-layout']}>
              <div style={{ flexShrink: 0 }}>
                <SampleSetFields setFields={setFields} formValues={values} />
              </div>

              <div className={styles['main-form-container']}>
                <div className={styles['sample-datagrid-container']}>
                  <SampleDataGrid
                    sampleFields={sampleFields}
                    samples={samples}
                    formValues={values}
                    rows={rows}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    copiedRowData={copiedRowData}
                    handleSampleChange={wrappedHandleSampleChange}
                    handleCopyRow={handleCopyRow}
                    handlePasteToRows={handlePasteToRows}
                    handleClearRows={handleClearRows}
                  />
                </div>
              </div>

              <div className={styles['submit-controls']}>
                <div>
                  <div
                    className={
                      isFormValid
                        ? 'text-success font-weight-bold'
                        : 'text-warning font-weight-bold'
                    }
                  >
                    {isFormValid
                      ? `READY: ${filledSampleCount} samples ready to export`
                      : `WARNING: ${filledSampleCount} samples (${
                          validation.errorCount
                        } errors)${
                          hasFormErrors
                            ? ` + Missing Sample Set Information (${formErrorCount} errors)`
                            : ''
                        }`}
                  </div>
                  <small className="text-muted">
                    {isFormValid
                      ? 'Only rows with data will be included in the CSV'
                      : 'Fix validation errors before generating CSV'}
                  </small>
                </div>

                <div className={styles['btn-group']}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    disabled={
                      isSubmitting || filledSampleCount === 0 || !isFormValid
                    }
                    onClick={() => handleSubmit(values)}
                  >
                    {isSubmitting
                      ? 'Generating...'
                      : !isFormValid
                      ? `Fix ${totalErrorCount} errors first`
                      : `Generate CSV (${filledSampleCount} samples)`}
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default MetadataForm;
