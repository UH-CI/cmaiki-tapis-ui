import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  downloadMetadataCSV,
} from './metadataUtils';
import { useSampleData } from './hooks/useSampleData';
import { useValidation } from './hooks/useValidation';
import { SampleDataGrid } from './components/SampleDataGrid';
import { ValidationErrorDetails } from './components/ValidationErrorDetails';

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
  formValues: { [key: string]: string };
  shouldShowField: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => boolean;
}

const SampleSetFields: React.FC<SampleSetFieldsProps> = ({
  setFields,
  formValues,
  shouldShowField,
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

const MetadataForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errorCount: number;
    errors: Record<string, string[]>;
  } | null>(null);
  const [hasValidated, setHasValidated] = useState(false);
  const previousProjectValuesRef = useRef<Record<string, string>>({});
  const projectChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    samples,
    selectedRows,
    setSelectedRows,
    copiedRowData,
    handleSampleChange,
    handleCopyRow,
    handlePasteToRows,
    handleClearRows,
    handleBulkImport,
    samplesWithData,
    filledSampleCount,
    rows,
  } = useSampleData({ sampleFields });

  const {
    validationSchema,
    validateForm,
    shouldShowField,
    getDynamicOptions,
    formatDateInput,
  } = useValidation({
    setFields,
    sampleFields,
    samples,
    metadataSchema,
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (projectChangeTimeoutRef.current) {
        clearTimeout(projectChangeTimeoutRef.current);
      }
    };
  }, []);

  // Project field change handler
  const handleProjectFieldChangeDebounced = useCallback(
    (fieldName: string, value: string) => {
      // Clear existing timeout
      if (projectChangeTimeoutRef.current) {
        clearTimeout(projectChangeTimeoutRef.current);
      }

      // Set new timeout for debounced change detection
      projectChangeTimeoutRef.current = setTimeout(() => {
        // Reset validation state when project fields change
        if (hasValidated) {
          setHasValidated(false);
          setValidationResult(null);
        }
      }, 500);
    },
    [hasValidated]
  );

  // Handle project-level field changes (immediate for Formik onChange)
  const handleProjectFieldChange = useCallback(
    (fieldName: string, value: string) => {
      handleProjectFieldChangeDebounced(fieldName, value);
    },
    [handleProjectFieldChangeDebounced]
  );

  // Manual validation function
  const handleValidate = async (values: any) => {
    setIsValidating(true);
    try {
      const result = await validateForm(values);
      setValidationResult(result);
      setHasValidated(true);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errorCount: 1,
        errors: { general: ['Validation error occurred'] },
      });
      setHasValidated(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!hasValidated) {
      alert('Please validate before generating CSV');
      return;
    }

    if (!validationResult?.isValid) {
      alert('Please fix validation errors before generating CSV');
      return;
    }

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
        onChange={(
          values: any,
          { name, value }: { name?: string; value?: any }
        ) => {
          // Detect changes to project-level fields
          if (name && setFields.some((field) => field.field_id === name)) {
            handleProjectFieldChange(name, value);
          }
        }}
      >
        {({ values, errors, setFieldValue, validateForm }) => {
          // Check for project field changes without causing infinite loops
          const currentProjectValues = setFields.reduce(
            (acc: Record<string, string>, field) => {
              acc[field.field_id] = (values as any)[field.field_id] || '';
              return acc;
            },
            {}
          );

          // Check if any project field has changed (only if we have previous values)
          if (Object.keys(previousProjectValuesRef.current).length > 0) {
            const hasProjectFieldChanged = setFields.some((field) => {
              const currentValue = (values as any)[field.field_id] || '';
              const previousValue =
                previousProjectValuesRef.current[field.field_id] || '';
              return currentValue !== previousValue;
            });

            if (hasProjectFieldChanged) {
              // Clear existing timeout
              if (projectChangeTimeoutRef.current) {
                clearTimeout(projectChangeTimeoutRef.current);
              }

              // Debounce the validation reset
              projectChangeTimeoutRef.current = setTimeout(() => {
                if (hasValidated) {
                  setHasValidated(false);
                  setValidationResult(null);
                }
              }, 500);
            }
          }

          // Update previous values for next comparison (using ref to avoid re-renders)
          previousProjectValuesRef.current = currentProjectValues;

          const wrappedHandleSampleChange = useCallback(
            (rowIndex: number, fieldId: string, value: string) => {
              handleSampleChange(rowIndex, fieldId, value);
              // Reset validation state when data changes
              if (hasValidated) {
                setHasValidated(false);
                setValidationResult(null);
              }
            },
            [handleSampleChange, hasValidated]
          );

          return (
            <div className={styles['form-layout']}>
              <div style={{ flexShrink: 0 }}>
                <SampleSetFields
                  setFields={setFields}
                  formValues={values}
                  shouldShowField={shouldShowField}
                />
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
                    handleBulkImport={handleBulkImport}
                    shouldShowField={shouldShowField}
                    getDynamicOptions={getDynamicOptions}
                    formatDateInput={formatDateInput}
                  />
                </div>
              </div>

              <div className={styles['submit-controls']}>
                <div>
                  <div
                    className={
                      validationResult?.isValid
                        ? 'text-success font-weight-bold'
                        : validationResult?.isValid === false
                        ? 'text-danger font-weight-bold'
                        : 'text-muted font-weight-bold'
                    }
                  >
                    {validationResult?.isValid
                      ? `VALIDATED: ${filledSampleCount} samples ready to export`
                      : validationResult?.isValid === false
                      ? `VALIDATION FAILED: ${validationResult.errorCount} errors found`
                      : hasValidated
                      ? `VALIDATION OUTDATED: ${filledSampleCount} samples (data changed, re-validate required)`
                      : `READY TO VALIDATE: ${filledSampleCount} samples`}
                  </div>
                  <small className="text-muted">
                    {validationResult?.isValid
                      ? 'Only rows with data will be included in the CSV'
                      : validationResult?.isValid === false
                      ? 'Fix validation errors before generating CSV'
                      : hasValidated
                      ? 'Data has changed since last validation - click Validate to re-check'
                      : 'Click Validate to check for errors before generating CSV'}
                  </small>
                </div>

                <div className={styles['btn-group']}>
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={isValidating || filledSampleCount === 0}
                    onClick={() => handleValidate(values)}
                    style={{ marginRight: '8px' }}
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    disabled={
                      isSubmitting ||
                      filledSampleCount === 0 ||
                      !validationResult?.isValid
                    }
                    onClick={() => handleSubmit(values)}
                  >
                    {isSubmitting
                      ? 'Generating...'
                      : !validationResult?.isValid
                      ? validationResult?.isValid === false
                        ? `Fix ${validationResult.errorCount} errors first`
                        : 'Validate first'
                      : `Generate CSV (${filledSampleCount} samples)`}
                  </Button>
                </div>
              </div>

              {validationResult && !validationResult.isValid && (
                <div style={{ width: '100%', marginTop: '0' }}>
                  <ValidationErrorDetails
                    errors={validationResult.errors}
                    errorCount={validationResult.errorCount}
                  />
                </div>
              )}
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default MetadataForm;
