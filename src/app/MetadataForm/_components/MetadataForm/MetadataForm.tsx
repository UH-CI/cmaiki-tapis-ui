import React, { useState, useMemo, useCallback } from 'react';
import { Formik } from 'formik';
import { Button as BootstrapButton } from 'reactstrap';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Box, Tooltip, Button, ButtonGroup } from '@mui/material';
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

const MetadataForm: React.FC = () => {
  const metadataFields = METADATA_FIELDS as MetadataFieldDef[];
  const setFields = getSetWideFields(metadataFields);
  const sampleFields = getSampleFields(metadataFields);

  const INITIAL_ROWS = 100;

  const [samples, setSamples] = useState<SampleData[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => createEmptySample(sampleFields))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [copiedRowData, setCopiedRowData] = useState<SampleData | null>(null);

  // Simplified validation - only check required fields for rows with data
  const validateSamples = useCallback(
    (samples: SampleData[]) => {
      const requiredFields = sampleFields.filter((field) => field.required);
      let errorCount = 0;

      samples.forEach((sample) => {
        const hasData = Object.values(sample).some((value) => value?.trim());
        if (hasData) {
          requiredFields.forEach((field) => {
            if (!sample[field.name]?.trim()) {
              errorCount++;
            }
          });
        }
      });

      return { isValid: errorCount === 0, errorCount };
    },
    [sampleFields]
  );

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

  const validation = useMemo(
    () => validateSamples(samplesWithData),
    [samplesWithData, validateSamples]
  );

  const initialValues = useMemo(
    () => setFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
    [setFields]
  );

  const validationSchema = useMemo(
    () => createMultiSampleValidationSchema(setFields, sampleFields),
    [setFields, sampleFields]
  );

  // Simplified sample change handler
  const handleSampleChange = useCallback(
    (rowIndex: number, fieldName: string, value: string) => {
      setSamples((prev) => {
        const newSamples = [...prev];
        newSamples[rowIndex] = { ...newSamples[rowIndex], [fieldName]: value };
        return newSamples;
      });
    },
    []
  );

  // Simplified row operations
  const handleCopyRow = useCallback(() => {
    if (selectedRows.length === 1) {
      const rowIndex = Number(selectedRows[0]) - 1;
      setCopiedRowData({ ...samples[rowIndex] });
    }
  }, [selectedRows, samples]);

  const handlePasteToRows = useCallback(() => {
    if (copiedRowData && selectedRows.length > 0) {
      selectedRows.forEach((id) => {
        const rowIndex = Number(id) - 1;
        Object.entries(copiedRowData).forEach(([fieldName, value]) => {
          if (value?.trim()) {
            handleSampleChange(rowIndex, fieldName, value);
          }
        });
      });
      setSelectedRows([]);
    }
  }, [copiedRowData, selectedRows, handleSampleChange]);

  const handleClearRows = useCallback(() => {
    selectedRows.forEach((id) => {
      const rowIndex = Number(id) - 1;
      sampleFields.forEach((field) => {
        handleSampleChange(rowIndex, field.name, '');
      });
    });
    setSelectedRows([]);
  }, [selectedRows, sampleFields, handleSampleChange]);

  // Generate columns for DataGrid
  const columns: GridColDef[] = useMemo(
    () =>
      sampleFields.map((field) => ({
        field: field.name,
        headerName: field.name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        width: Math.max(120, Math.min(180, field.name.length * 12)),
        editable: true,
        type: field.inputMode === 'dropdown' ? 'singleSelect' : 'string',
        valueOptions:
          field.inputMode === 'dropdown' ? field.options : undefined,
        headerTooltip: `${field.definition}${
          field.example ? ` (Example: ${field.example})` : ''
        }`,
        renderHeader: () => (
          <Tooltip
            title={
              <div style={{ maxWidth: '300px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {field.name
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
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
            }
            arrow
            placement="top"
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                cursor: 'help',
              }}
            >
              {field.name
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              {field.required && <span style={{ color: 'red' }}> *</span>}
            </div>
          </Tooltip>
        ),
        renderCell: (params) => {
          const cellValue = params.value?.toString() || '';
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                padding: '4px 6px',
              }}
            >
              {cellValue || (field.inputMode === 'dropdown' ? 'Select...' : '')}
            </div>
          );
        },
      })),
    [sampleFields]
  );

  // Generate rows
  const rows: GridRowsProp = useMemo(
    () => samples.map((sample, index) => ({ id: index + 1, ...sample })),
    [samples]
  );

  const handleSubmit = async (values: any) => {
    if (samplesWithData.length === 0) {
      alert('Please enter data for at least one sample before generating CSV.');
      return;
    }

    if (!validation.isValid) {
      alert(
        `Please fix ${validation.errorCount} validation errors before proceeding.`
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
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV file');
    } finally {
      setIsSubmitting(false);
    }
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

            <div className={styles.mainFormContainer}>
              <div className={styles.header}>
                <h4>Sample Data Spreadsheet</h4>
              </div>

              {/* Simplified controls */}
              <div className="mb-3">
                <ButtonGroup size="small" disabled={selectedRows.length === 0}>
                  <Button
                    variant="outlined"
                    onClick={handleCopyRow}
                    disabled={selectedRows.length !== 1}
                  >
                    Copy Row
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handlePasteToRows}
                    disabled={!copiedRowData || selectedRows.length === 0}
                  >
                    Paste to Selected
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearRows}
                  >
                    Clear Selected
                  </Button>
                </ButtonGroup>
                {copiedRowData && (
                  <span className="badge badge-info ms-2">Row data copied</span>
                )}
              </div>

              <Box sx={{ height: '75vh', width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  hideFooterPagination
                  hideFooterSelectedRowCount
                  checkboxSelection
                  disableRowSelectionOnClick={false}
                  rowSelectionModel={selectedRows}
                  onRowSelectionModelChange={setSelectedRows}
                  isCellEditable={() => true}
                  onCellClick={(params) => {
                    params.api.startCellEditMode({
                      id: params.id,
                      field: params.field,
                    });
                  }}
                  processRowUpdate={(newRow, oldRow) => {
                    const rowIndex = Number(newRow.id) - 1;
                    Object.keys(newRow).forEach((fieldName) => {
                      if (
                        fieldName !== 'id' &&
                        newRow[fieldName] !== oldRow[fieldName]
                      ) {
                        handleSampleChange(
                          rowIndex,
                          fieldName,
                          newRow[fieldName] || ''
                        );
                      }
                    });
                    return newRow;
                  }}
                  getRowClassName={(params) => {
                    const sample = samples[(params.id as number) - 1];
                    const hasData =
                      sample &&
                      Object.values(sample).some((value) => value?.trim());
                    return hasData ? 'row-with-data' : '';
                  }}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.875rem',
                      padding: '4px 6px',
                      border: '1px solid #e0e0e0',
                      cursor: 'text',
                      display: 'flex',
                      alignItems: 'center',
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
                    '& .MuiDataGrid-row': {
                      '&.row-with-data': {
                        backgroundColor: 'rgba(40, 167, 69, 0.04)',
                        '&:hover': {
                          backgroundColor: 'rgba(40, 167, 69, 0.08)',
                        },
                      },
                    },
                    '& .MuiDataGrid-footerContainer': {
                      display: 'none',
                    },
                    '& .MuiDataGrid-cell input': {
                      cursor: 'text',
                    },
                  }}
                />
              </Box>
            </div>

            <div className={styles.submitControls}>
              <div>
                <div
                  className={
                    validation.isValid
                      ? 'text-success font-weight-bold'
                      : 'text-warning font-weight-bold'
                  }
                >
                  {validation.isValid
                    ? `READY: ${filledSampleCount} samples ready to export`
                    : `WARNING: ${filledSampleCount} samples (${validation.errorCount} errors)`}
                </div>
                <small className="text-muted">
                  {validation.isValid
                    ? 'Only rows with data will be included in the CSV'
                    : 'Fix validation errors before generating CSV'}
                </small>
              </div>
              <div className={styles['btn-group']}>
                <BootstrapButton
                  type="submit"
                  color="success"
                  disabled={
                    isSubmitting ||
                    filledSampleCount === 0 ||
                    !validation.isValid
                  }
                  onClick={() => handleSubmit(values)}
                >
                  {isSubmitting
                    ? 'Generating...'
                    : !validation.isValid
                    ? `Fix ${validation.errorCount} errors first`
                    : `Generate CSV (${filledSampleCount} samples)`}
                </BootstrapButton>
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
