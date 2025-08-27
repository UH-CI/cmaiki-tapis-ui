import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Formik } from 'formik';
import { Button } from 'reactstrap';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Box, Tooltip } from '@mui/material';
import styles from './MetadataForm.module.scss';
import { FormikInput, FormikSelect } from '@tapis/tapisui-common';
import METADATA_FIELDS from './metadataFields.json';
import {
  type MetadataFieldDef,
  type SampleData,
  type MultiSampleMetadata,
  getSetWideFields,
  getSampleFields,
  createMultiSampleValidationSchema,
  downloadMultiSampleCSV,
  createEmptySample,
} from './metadataUtils';

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
}

const SampleSetFields: React.FC<SampleSetFieldsProps> = ({ setFields }) => {
  const formatFieldName = (field: MetadataFieldDef): string =>
    field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className={styles.mainFormContainer}>
      <div className={styles.header}>
        <h4>Sample Set Information</h4>
        <small className="text-muted">
          These fields apply to all samples in this batch
        </small>
      </div>
      <div className="row">
        {setFields.map((field) => (
          <div key={field.name} className="col-md-6 mb-3">
            <div className={styles.fieldContainer}>
              {field.inputMode === 'dropdown' ? (
                <FormikSelect
                  name={field.name}
                  label={formatFieldName(field)}
                  required={field.required}
                  description={`Example: ${field.example}`}
                  labelClassName={styles.argLabel}
                  className={styles.formikSelect}
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FormikSelect>
              ) : (
                <FormikInput
                  name={field.name}
                  label={formatFieldName(field)}
                  required={field.required}
                  description={`Example: ${field.example}`}
                  labelClassName={styles.argLabel}
                />
              )}
              <small className={styles.definitionText}>
                <strong>Definition:</strong> {field.definition}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface InfiniteSampleDataGridProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  onSampleChange: (rowIndex: number, fieldName: string, value: string) => void;
  validationErrors: { [rowIndex: number]: { [fieldName: string]: string } };
}

const InfiniteSampleDataGrid: React.FC<InfiniteSampleDataGridProps> = ({
  sampleFields,
  samples,
  onSampleChange,
  validationErrors,
}) => {
  const formatFieldName = (field: MetadataFieldDef): string =>
    field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Generate columns
  const columns: GridColDef[] = useMemo(
    () =>
      sampleFields.map((field) => ({
        field: field.name,
        headerName: formatFieldName(field),
        width:
          field.name.length <= 8 ? 120 : field.name.length <= 15 ? 150 : 180,
        editable: true,
        headerTooltip: `${field.definition}${
          field.example ? ` (Example: ${field.example})` : ''
        }`,
        renderHeader: () => {
          const tooltipContent = (
            <div style={{ maxWidth: '300px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {formatFieldName(field)}
              </div>
              <div style={{ marginBottom: '8px', fontSize: '0.875rem' }}>
                {field.definition}
              </div>
              {field.example && (
                <div
                  style={{
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                    color: '#ccc',
                  }}
                >
                  Example: {field.example}
                </div>
              )}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} arrow placement="top">
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  cursor: 'help',
                }}
              >
                {formatFieldName(field)}
                {field.required && <span style={{ color: 'red' }}> *</span>}
              </div>
            </Tooltip>
          );
        },
        type: field.inputMode === 'dropdown' ? 'singleSelect' : 'string',
        valueOptions:
          field.inputMode === 'dropdown' ? field.options : undefined,
        renderCell: (params) => {
          const hasError =
            !!validationErrors[Number(params.id) - 1]?.[field.name];
          const cellValue = params.value?.toString() || '';

          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                color: hasError ? '#d32f2f' : 'inherit',
                backgroundColor: hasError ? '#ffebee' : 'transparent',
                fontSize: '0.875rem',
                padding: '4px 6px',
              }}
            >
              {cellValue || (field.inputMode === 'dropdown' ? 'Select...' : '')}
            </div>
          );
        },
      })),
    [sampleFields, validationErrors]
  );

  // Generate rows with unique IDs
  const rows: GridRowsProp = useMemo(
    () =>
      samples.map((sample, index) => ({
        id: index + 1, // DataGrid requires unique IDs
        ...sample,
      })),
    [samples]
  );

  const totalValidationErrors = useMemo(
    () =>
      Object.values(validationErrors).reduce(
        (total, rowErrors) => total + Object.keys(rowErrors).length,
        0
      ),
    [validationErrors]
  );

  return (
    <div className={styles.mainFormContainer}>
      <div className={styles.header}>
        <h4>Sample Data Spreadsheet</h4>
      </div>

      {totalValidationErrors > 0 && (
        <div className="mb-2">
          <span className="badge badge-danger">
            {totalValidationErrors} validation errors
          </span>
        </div>
      )}

      <Box sx={{ height: '75vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          hideFooterPagination
          hideFooterSelectedRowCount
          disableRowSelectionOnClick
          isCellEditable={() => true}
          onCellClick={(params) => {
            // Immediately enter edit mode on click
            params.api.startCellEditMode({
              id: params.id,
              field: params.field,
            });
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
              padding: '4px 6px',
              border: '1px solid #e0e0e0',
              cursor: 'text',
              '&:focus-within': {
                outline: '2px solid #1976d2',
                outlineOffset: '-2px',
              },
              '&.MuiDataGrid-cell--editing': {
                backgroundColor: 'white',
                outline: '2px solid #1976d2',
                outlineOffset: '-2px',
              },
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#e9ecef',
              border: '1px solid #adb5bd',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f7fa',
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'block',
            },
            '& .MuiDataGrid-cell--textLeft': {
              justifyContent: 'flex-start',
            },
            // Style rows with data differently
            '& .MuiDataGrid-row': {
              '&[data-has-data="true"]': {
                backgroundColor: 'rgba(40, 167, 69, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(40, 167, 69, 0.08)',
                },
              },
            },
            // Hide footer completely for infinite scroll feel
            '& .MuiDataGrid-footerContainer': {
              display: 'none',
            },
            // Better editing cursor for text inputs
            '& .MuiDataGrid-cell input': {
              cursor: 'text',
            },
          }}
          getRowClassName={(params) => {
            const sample = samples[(params.id as number) - 1];
            const hasData =
              sample && Object.values(sample).some((value) => value?.trim());
            return hasData ? 'row-with-data' : '';
          }}
          processRowUpdate={(newRow, oldRow) => {
            // Handle the update when user finishes editing
            const rowIndex = Number(newRow.id) - 1;
            const updatedFields = Object.keys(newRow).filter(
              (key) => key !== 'id' && newRow[key] !== oldRow[key]
            );

            updatedFields.forEach((fieldName) => {
              if (sampleFields.some((f) => f.name === fieldName)) {
                onSampleChange(rowIndex, fieldName, newRow[fieldName] || '');
              }
            });

            return newRow;
          }}
        />
      </Box>
    </div>
  );
};

const MetadataForm: React.FC = () => {
  const metadataFields = METADATA_FIELDS as MetadataFieldDef[];
  const setFields = getSetWideFields(metadataFields);
  const sampleFields = getSampleFields(metadataFields);

  const INITIAL_ROWS = 100;
  const EXPANSION_THRESHOLD = 20; // When to add more rows
  const BATCH_SIZE = 50;

  const [samples, setSamples] = useState<SampleData[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => createEmptySample(sampleFields))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [rowIndex: number]: { [fieldName: string]: string };
  }>({});

  // Validation logic
  const validateSamples = useCallback(
    (samples: SampleData[]) => {
      const newErrors: { [rowIndex: number]: { [fieldName: string]: string } } =
        {};
      const requiredFields = sampleFields.filter((field) => field.required);

      samples.forEach((sample, index) => {
        const hasData = Object.values(sample).some((value) => value?.trim());
        if (hasData) {
          requiredFields.forEach((field) => {
            if (!sample[field.name]?.trim()) {
              if (!newErrors[index]) newErrors[index] = {};
              newErrors[index][field.name] = 'Required';
            }
          });
        }
      });

      setValidationErrors(newErrors);
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
      };
    },
    [sampleFields]
  );

  // Debounced validation
  const debouncedValidation = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (debouncedValidation.current) clearTimeout(debouncedValidation.current);
    debouncedValidation.current = setTimeout(
      () => validateSamples(samples),
      500
    );
    return () =>
      debouncedValidation.current && clearTimeout(debouncedValidation.current);
  }, [samples, validateSamples]);

  // Memoized calculations
  const filledSampleCount = useMemo(
    () =>
      samples.filter((sample) =>
        Object.values(sample).some((value) => value?.trim())
      ).length,
    [samples]
  );

  const samplesWithData = useMemo(
    () =>
      samples.filter((sample) =>
        Object.values(sample).some((value) => value?.trim())
      ),
    [samples]
  );

  const totalValidationErrors = useMemo(
    () =>
      Object.values(validationErrors).reduce(
        (total, rowErrors) => total + Object.keys(rowErrors).length,
        0
      ),
    [validationErrors]
  );

  const initialValues = useMemo(
    () => setFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
    [setFields]
  );

  const validationSchema = useMemo(
    () => createMultiSampleValidationSchema(setFields, sampleFields),
    [setFields, sampleFields]
  );

  const handleSampleChange = useCallback(
    (rowIndex: number, fieldName: string, value: string) => {
      setSamples((prev) => {
        const newSamples = [...prev];
        newSamples[rowIndex] = { ...newSamples[rowIndex], [fieldName]: value };

        // Auto-expand rows when approaching the end
        const lastFilledRow = newSamples.findLastIndex((sample) =>
          Object.values(sample).some((val) => val?.trim())
        );

        if (lastFilledRow > newSamples.length - EXPANSION_THRESHOLD) {
          const additionalRows = Array.from({ length: BATCH_SIZE }, () =>
            createEmptySample(sampleFields)
          );
          return [...newSamples, ...additionalRows];
        }

        return newSamples;
      });
    },
    [sampleFields, BATCH_SIZE, EXPANSION_THRESHOLD]
  );

  const handleSubmit = async (values: any) => {
    if (samplesWithData.length === 0) {
      alert('Please enter data for at least one sample before generating CSV.');
      return;
    }

    const validation = validateSamples(samplesWithData);
    if (!validation.isValid) {
      const errorCount = Object.keys(validation.errors).length;
      alert(
        `Please fix ${errorCount} validation error${
          errorCount > 1 ? 's' : ''
        } before proceeding.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const setWideFields = setFields.reduce(
        (acc, field) => ({ ...acc, [field.name]: values[field.name] || '' }),
        {}
      );
      const multiSampleData: MultiSampleMetadata = {
        setWideFields,
        samples: samplesWithData,
      };

      downloadMultiSampleCSV(multiSampleData, setFields, sampleFields);
      console.log(
        `Multi-sample metadata CSV generated successfully for ${samplesWithData.length} samples`
      );
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear all sample data? This cannot be undone.'
      )
    ) {
      setSamples(
        Array.from({ length: INITIAL_ROWS }, () =>
          createEmptySample(sampleFields)
        )
      );
      setValidationErrors({});
    }
  };

  const previewCSV = (values: any) => {
    const setWideFields = setFields.reduce(
      (acc, field) => ({ ...acc, [field.name]: values[field.name] || '' }),
      {}
    );
    console.log('Preview - Set-wide fields:', setWideFields);
    console.log('Preview - Samples with data:', samplesWithData);
  };

  return (
    <div className="container-fluid">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors }) => (
          <>
            <SampleSetFields setFields={setFields} />

            <InfiniteSampleDataGrid
              sampleFields={sampleFields}
              samples={samples}
              onSampleChange={handleSampleChange}
              validationErrors={validationErrors}
            />

            <div className={styles.submitControls}>
              <div className="d-flex align-items-center gap-3">
                <div>
                  <div
                    className={
                      totalValidationErrors > 0
                        ? 'text-warning font-weight-bold'
                        : 'text-success font-weight-bold'
                    }
                  >
                    {totalValidationErrors > 0
                      ? `⚠️ ${filledSampleCount} samples (${totalValidationErrors} errors)`
                      : `✓ Ready to export ${filledSampleCount} samples`}
                  </div>
                  <small className="text-muted">
                    {totalValidationErrors > 0
                      ? 'Fix validation errors before generating CSV'
                      : 'Only rows with data will be included in the CSV'}
                  </small>
                </div>
                {filledSampleCount > 0 && (
                  <Button
                    color="warning"
                    size="sm"
                    onClick={clearAllData}
                    outline
                  >
                    Clear All Data
                  </Button>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  color="info"
                  className="me-2"
                  onClick={() => previewCSV(values)}
                  disabled={filledSampleCount === 0}
                >
                  Preview Data
                </Button>
                <Button
                  type="submit"
                  color="success"
                  disabled={
                    isSubmitting ||
                    filledSampleCount === 0 ||
                    totalValidationErrors > 0
                  }
                  onClick={() => handleSubmit(values)}
                >
                  {isSubmitting
                    ? 'Generating...'
                    : totalValidationErrors > 0
                    ? `Fix ${totalValidationErrors} errors first`
                    : `Generate CSV (${filledSampleCount} samples)`}
                </Button>
              </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="alert alert-danger mt-3">
                <h6>
                  Please fix the following errors in Sample Set Information:
                </h6>
                <ul className="mb-0">
                  {Object.entries(errors)
                    .filter(([field]) => field !== 'samples')
                    .map(([field, error]) => (
                      <li key={field}>
                        <strong>{field.replace(/_/g, ' ')}:</strong>{' '}
                        {String(error)}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Formik>
    </div>
  );
};

export default MetadataForm;
