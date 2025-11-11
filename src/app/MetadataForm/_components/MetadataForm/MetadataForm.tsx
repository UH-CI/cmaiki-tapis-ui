import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { Formik } from 'formik';
import { Button, Tabs, Tab, Box, Alert } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
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

const FIELD_GROUPS: {
  [groupKey: string]: {
    header: string;
    fieldIds: string[];
  };
} = {
  point_of_contact: {
    header: 'Contact Information for Primary Point of Contact',
    fieldIds: ['point_of_contact', 'point_of_contact_email'],
  },
  secondary_point_of_contact: {
    header: 'Contact Information for Secondary Point of Contact',
    fieldIds: [
      'secondary_point_of_contact',
      'secondary_point_of_contact_email',
    ],
  },
  sequencing_point_of_contact: {
    header: 'Contact Information for Sequencing Point of Contact',
    fieldIds: [
      'sequencing_point_of_contact',
      'sequencing_point_of_contact_email',
    ],
  },
};

const SampleSetFields: React.FC<SampleSetFieldsProps> = React.memo(
  ({ setFields, formValues, shouldShowField }) => {
    // Memoize filtered fields to prevent unnecessary re-filtering
    const visibleFields = useMemo(
      () => setFields.filter((field) => shouldShowField(field, formValues)),
      [setFields, formValues, shouldShowField]
    );

    const { groupedFields, individualFields } = useMemo(() => {
      const grouped: Array<{
        groupKey: string;
        header: string;
        fields: MetadataFieldDef[];
      }> = [];
      const standalone: MetadataFieldDef[] = [];
      const processedFieldIds = new Set<string>();

      // Process each group
      Object.entries(FIELD_GROUPS).forEach(([groupKey, groupConfig]) => {
        const groupFields = visibleFields.filter(
          (field) =>
            groupConfig.fieldIds.includes(field.field_id) &&
            shouldShowField(field, formValues)
        );

        if (groupFields.length > 0) {
          grouped.push({
            groupKey,
            header: groupConfig.header,
            fields: groupFields,
          });
          groupFields.forEach((field) => processedFieldIds.add(field.field_id));
        }
      });

      visibleFields.forEach((field) => {
        if (!processedFieldIds.has(field.field_id)) {
          standalone.push(field);
        }
      });

      return { groupedFields: grouped, individualFields: standalone };
    }, [visibleFields, formValues, shouldShowField]);

    return (
      <div className={styles['main-form-container']}>
        <div className={styles['fields-grid']}>
          {individualFields.map((field) => (
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
          ))}
          {groupedFields.map((group) => (
            <div key={group.groupKey} className={styles['field-group']}>
              <h3 className={styles['field-group-header']}>{group.header}</h3>
              <div className={styles['field-group-content']}>
                {group.fields.map((field) => (
                  <div key={field.field_id} className={styles['field-column']}>
                    <FormikInput
                      name={field.field_id}
                      label={field.field_name}
                      required={field.required}
                      description={
                        field.example ? `Example: ${field.example}` : ''
                      }
                      infoText={field.definition}
                      labelClassName={styles['arg-label']}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

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
                    className={styles['button-margin-right']}
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
