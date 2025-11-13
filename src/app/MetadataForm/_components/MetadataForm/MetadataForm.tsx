import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Formik } from 'formik';
import { Tabs, Tab, Box, Alert } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import styles from './MetadataForm.module.scss';
import METADATA_SCHEMA from './cmaiki_metadata_schema.json';
import {
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
import { SampleSetFields } from './components/SampleSetFields';
import { ValidationControls } from './components/ValidationControls';

const metadataSchema = METADATA_SCHEMA as MetadataSchema;
const metadataFields = metadataSchema.fields;
const setFields = getSetWideFields(metadataFields);
const sampleFields = getSampleFields(metadataFields);
const initialValues = setFields.reduce(
  (acc, field) => ({ ...acc, [field.field_id]: '' }),
  {}
);

const MetadataForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
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
    handleAddMoreRows,
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
    clearCaches,
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
        // Clear caches when form values change significantly
        clearCaches();

        // Reset validation state when project fields change
        if (hasValidated) {
          setHasValidated(false);
          setValidationResult(null);
        }
      }, 500);
    },
    [hasValidated, clearCaches]
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
              // Clear caches when sample data changes
              clearCaches();
              // Reset validation state when data changes
              if (hasValidated) {
                setHasValidated(false);
                setValidationResult(null);
              }
            },
            [handleSampleChange, hasValidated, clearCaches]
          );

          return (
            <div className={styles['form-layout']}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  aria-label="metadata form tabs"
                >
                  <Tab label="Project Information" />
                  <Tab label="Sample Data" />
                </Tabs>
              </Box>

              <div className={styles['tab-content']}>
                {activeTab === 0 && (
                  <div className={styles['tab-panel']}>
                    <SampleSetFields
                      setFields={setFields}
                      formValues={values}
                      shouldShowField={shouldShowField}
                    />
                  </div>
                )}

                {activeTab === 1 && (
                  <div className={styles['tab-panel']}>
                    {!bannerDismissed && (
                      <Alert
                        severity="info"
                        onClose={() => setBannerDismissed(true)}
                        icon={<LightbulbIcon />}
                        className={styles['dismissable-banner']}
                        sx={{ mb: 2 }}
                      >
                        Hover over column headers to view examples and
                        formatting requirements
                      </Alert>
                    )}
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
                        handleAddMoreRows={handleAddMoreRows}
                        shouldShowField={shouldShowField}
                        getDynamicOptions={getDynamicOptions}
                        formatDateInput={formatDateInput}
                      />
                    </div>
                  </div>
                )}
              </div>

              <ValidationControls
                validationResult={validationResult}
                hasValidated={hasValidated}
                filledSampleCount={filledSampleCount}
                isValidating={isValidating}
                isSubmitting={isSubmitting}
                onValidate={() => handleValidate(values)}
                onSubmit={() => handleSubmit(values)}
              />

              {validationResult && !validationResult.isValid && (
                <div className={styles['validation-error-wrapper']}>
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
