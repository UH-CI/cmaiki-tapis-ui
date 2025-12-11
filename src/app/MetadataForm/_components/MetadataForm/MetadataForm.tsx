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
import { v4 as uuidv4 } from 'uuid';
import { downloadMetadataXLSX, generateMetadataXLSXBlob } from './xlsxUtils';
import { useSampleData } from './hooks/useSampleData';
import { useValidation } from './hooks/useValidation';
import { SampleDataGrid } from './components/SampleDataGrid';
import { ValidationErrorDetails } from './components/ValidationErrorDetails';
import { SampleSetFields } from './components/SampleSetFields';
import { ValidationControls } from './components/ValidationControls';
import { GuideTab } from './components/GuideTab';
import ProjectUploadModal from './components/ProjectUploadModal';

const metadataSchema = METADATA_SCHEMA as MetadataSchema;
const metadataFields = metadataSchema.fields;
const setFields = getSetWideFields(metadataFields);
const sampleFields = getSampleFields(metadataFields);
const initialValues = setFields.reduce(
  (acc, field) => ({ ...acc, [field.field_id]: '' }),
  {}
);

const sanitizeForId = (value: string): string =>
  value.trim().replace(/[^a-zA-Z0-9]+/g, '_');

const generateSampleId = (baseName: string, index: number): string =>
  `${sanitizeForId(baseName)}_${index}`;

// Validation result type
type ValidationResult = {
  isValid: boolean;
  errorCount: number;
  errors: Record<string, string[]>;
  projectUuid?: string;
  sampleIds?: string[];
};

const MetadataForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [xlsxBlobForUpload, setXlsxBlobForUpload] = useState<Blob | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

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

  const handleValidate = async (values: any) => {
    setIsValidating(true);
    try {
      const result = await validateForm(values);

      if (result.isValid) {
        const projectUuid = uuidv4();
        const sampleIds = samplesWithData.map((sample, idx) =>
          generateSampleId(sample.samp_name || '', idx)
        );

        setValidationResult({ ...result, projectUuid, sampleIds });
      } else {
        setValidationResult(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errorCount: 1,
        errors: { general: ['Validation error occurred'] },
      });
    } finally {
      setIsValidating(false);
    }
  };

  const generateXLSXBlob = useCallback(
    (values: any): { blob: Blob; filename: string } | null => {
      if (
        !validationResult?.isValid ||
        !validationResult.projectUuid ||
        !validationResult.sampleIds
      ) {
        return null;
      }

      try {
        const setWideFields = {
          ...setFields.reduce(
            (acc, field) => ({
              ...acc,
              [field.field_id]: values[field.field_id] || '',
            }),
            {}
          ),
          project_uuid: validationResult.projectUuid,
        };

        const samplesWithIds = samplesWithData.map((sample, idx) => ({
          sample_id: validationResult.sampleIds![idx],
          ...sample,
        }));

        const multiSampleData: MultiSampleMetadata = {
          setWideFields,
          samples: samplesWithIds,
        };

        return generateMetadataXLSXBlob(
          multiSampleData,
          setFields,
          sampleFields
        );
      } catch (error) {
        console.error('Error generating XLSX blob:', error);
        return null;
      }
    },
    [validationResult, samplesWithData]
  );

  const handleSubmit = async (values: any) => {
    if (!validationResult?.isValid) {
      alert(
        'Please validate the form and fix any errors before generating XLSX'
      );
      return;
    }

    if (!validationResult.projectUuid || !validationResult.sampleIds) {
      alert('Project UUID or sample IDs not generated. Please re-validate.');
      return;
    }

    setIsSubmitting(true);
    try {
      const setWideFields = {
        ...setFields.reduce(
          (acc, field) => ({
            ...acc,
            [field.field_id]: values[field.field_id] || '',
          }),
          {}
        ),
        project_uuid: validationResult.projectUuid,
      };

      const samplesWithIds = samplesWithData.map((sample, idx) => ({
        sample_id: validationResult.sampleIds![idx],
        ...sample,
      }));

      const multiSampleData: MultiSampleMetadata = {
        setWideFields,
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

  const handleDataChange = useCallback(
    (rowIndex: number, fieldId: string, value: string) => {
      handleSampleChange(rowIndex, fieldId, value);
      clearCaches();
      if (validationResult) {
        setValidationResult(null);
      }
    },
    [handleSampleChange, clearCaches, validationResult]
  );

  const handleUploadToProject = useCallback(
    (values: any) => {
      if (!validationResult?.isValid) {
        alert('Please validate the form before uploading');
        return;
      }

      const result = generateXLSXBlob(values);
      if (result) {
        // Add filename as a property on the blob object
        (result.blob as any).__filename = result.filename;
        setXlsxBlobForUpload(result.blob);
        setUploadModalOpen(true);
      } else {
        alert('Error generating XLSX file for upload');
      }
    },
    [validationResult, generateXLSXBlob]
  );

  const handleUploadModalClose = useCallback(() => {
    setUploadModalOpen(false);
    setXlsxBlobForUpload(null);
  }, []);

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
            Object.entries(metadata).forEach(([fieldId, value]) => {
              if (setFields.some((field) => field.field_id === fieldId)) {
                setFieldValue(fieldId, value);
              }
            });
            clearCaches();
            setValidationResult(null);
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
                  <Tab label="Guide" />
                </Tabs>
              </Box>

              <div className={styles['tab-content']}>
                {activeTab === 0 && (
                  <div className={styles['tab-panel']}>
                    <SampleSetFields
                      setFields={setFields}
                      formValues={values}
                      shouldShowField={shouldShowField}
                      projectUuid={validationResult?.projectUuid}
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
                        handleSampleChange={handleDataChange}
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
                        sampleIds={validationResult?.sampleIds}
                        validationErrors={validationResult?.errors}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  <div
                    className={`${styles['tab-panel']} ${styles['guide-tab-panel']}`}
                  >
                    <GuideTab metadataSchema={metadataSchema} />
                  </div>
                )}
              </div>

              <ValidationControls
                validationResult={validationResult}
                hasValidated={!!validationResult}
                filledSampleCount={filledSampleCount}
                isValidating={isValidating}
                isSubmitting={isSubmitting}
                onValidate={() => handleValidate(values)}
                onSubmit={() => handleSubmit(values)}
                onUploadToProject={() => handleUploadToProject(values)}
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

      <ProjectUploadModal
        open={uploadModalOpen}
        onClose={handleUploadModalClose}
        xlsxBlob={xlsxBlobForUpload}
      />
    </div>
  );
};

export default MetadataForm;
