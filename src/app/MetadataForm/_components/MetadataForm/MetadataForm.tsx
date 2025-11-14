import React, { useState, useCallback } from 'react';
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
} from './metadataUtils';
import { downloadMetadataXLSX } from './xlsxUtils';
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

// Sanitize values, replace non-alphanumeric chars with underscores
const sanitizeValues = (value: string, defaultValue: string = ''): string => {
  if (!value || !value.trim()) {
    return defaultValue;
  }
  return value.trim().replace(/[^a-zA-Z0-9]+/g, '_');
};

// Sample ID generation configuration
const SAMPLE_ID_CONFIG = {
  baseField: 'samp_name',
  defaultBase: '',
  template: (sanitizedBase: string, index: number) =>
    `${sanitizedBase}_${index}`,
};

// Generate sample IDs based on SAMPLE_ID_CONFIG template
// Only generates IDs for samples that have data (non-empty samples)
const generateSampleIds = (
  allSamples: any[],
  samplesWithData: any[]
): string[] => {
  // Create a map to store IDs for all samples (including empty ones)
  const sampleIdMap = new Map<number, string>();

  // Generate IDs only for samples with data
  samplesWithData.forEach((sampleWithData, dataIndex) => {
    // Find the original index in the full samples array
    const originalIndex = allSamples.findIndex((s) => s === sampleWithData);

    if (originalIndex !== -1) {
      const baseValue = sampleWithData[SAMPLE_ID_CONFIG.baseField] || '';
      const sanitizedBase = sanitizeValues(
        baseValue,
        SAMPLE_ID_CONFIG.defaultBase
      );
      const sampleId = SAMPLE_ID_CONFIG.template(sanitizedBase, dataIndex);
      sampleIdMap.set(originalIndex, sampleId);
    }
  });

  // Return array with IDs in correct positions (empty strings for rows without data)
  return allSamples.map((_, index) => sampleIdMap.get(index) || '');
};

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

  // State for auto-generated identifiers
  const [projectUuid, setProjectUuid] = useState<string>('');
  const [sampleIds, setSampleIds] = useState<string[]>([]);

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

  // Manual validation function
  const handleValidate = async (values: any) => {
    setIsValidating(true);
    try {
      const result = await validateForm(values);
      setValidationResult(result);
      setHasValidated(true);

      // Generate identifiers only on successful validation
      if (result.isValid) {
        // Generate project UUID
        const uuid = crypto.randomUUID();
        setProjectUuid(uuid);

        // Generate sample IDs only for samples with data
        const ids = generateSampleIds(samples, samplesWithData);
        setSampleIds(ids);
      } else {
        // Clear identifiers if validation fails
        setProjectUuid('');
        setSampleIds([]);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errorCount: 1,
        errors: { general: ['Validation error occurred'] },
      });
      setHasValidated(true);
      setProjectUuid('');
      setSampleIds([]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!hasValidated) {
      alert('Please validate before generating XLSX');
      return;
    }

    if (!validationResult?.isValid) {
      alert('Please fix validation errors before generating XLSX');
      return;
    }

    if (!projectUuid) {
      alert('Project UUID not generated. Please re-validate.');
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

      // Add project UUID to set-wide fields
      const fieldsWithUuid = {
        ...setWideFields,
        project_uuid: projectUuid,
      };

      // Add sample IDs to sample data
      const samplesWithIds = samplesWithData.map((sample) => {
        const originalIndex = samples.findIndex((s) => s === sample);
        return {
          sample_id: sampleIds[originalIndex] || '',
          ...sample,
        };
      });

      const multiSampleData: MultiSampleMetadata = {
        setWideFields: fieldsWithUuid,
        samples: samplesWithIds,
      };

      downloadMetadataXLSX(multiSampleData, setFields, sampleFields);
    } catch (error) {
      console.error('Error generating XLSX:', error);
      alert('Error generating XLSX file');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize sample change handler outside of Formik render
  const wrappedHandleSampleChange = useCallback(
    (rowIndex: number, fieldId: string, value: string) => {
      handleSampleChange(rowIndex, fieldId, value);
      // Clear caches when sample data changes
      clearCaches();

      // Clear sample IDs when user modifies data (forcing re-validation)
      if (sampleIds.length > 0) {
        setSampleIds([]);
        setHasValidated(false);
        setValidationResult(null);
      }
    },
    [handleSampleChange, clearCaches, sampleIds.length]
  );

  return (
    <div className={styles['container']}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue }) => {
          const handleProjectMetadataImport = (metadata: {
            [key: string]: string;
          }) => {
            // Update form values with imported project metadata
            Object.entries(metadata).forEach(([fieldId, value]) => {
              if (setFields.some((field) => field.field_id === fieldId)) {
                setFieldValue(fieldId, value);
              }
            });

            // Clear caches and reset validation when importing
            clearCaches();
            if (hasValidated) {
              setHasValidated(false);
              setValidationResult(null);
              setProjectUuid('');
              setSampleIds([]);
            }
          };

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
                      projectUuid={projectUuid}
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
                        handleProjectMetadataImport={
                          handleProjectMetadataImport
                        }
                        handleAddMoreRows={handleAddMoreRows}
                        shouldShowField={shouldShowField}
                        getDynamicOptions={getDynamicOptions}
                        formatDateInput={formatDateInput}
                        sampleIds={sampleIds}
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
