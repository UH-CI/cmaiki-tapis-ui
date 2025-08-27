import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Formik } from 'formik';
import { Button } from 'reactstrap';
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

interface CellEditorProps {
  value: string;
  onChange: (rowIndex: number, fieldName: string, value: string) => void;
  field: MetadataFieldDef;
  rowIndex: number;
}

const CellEditor: React.FC<CellEditorProps> = React.memo(
  ({ value, onChange, field, rowIndex }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      setLocalValue(value || '');
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onChange(rowIndex, field.name, newValue);
        }, 150);
      },
      [onChange, rowIndex, field.name]
    );

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const cellStyle: React.CSSProperties = {
      width: '100%',
      fontSize: '0.875rem',
    };

    if (field.inputMode === 'dropdown') {
      return (
        <select
          value={localValue}
          onChange={handleChange}
          className="form-control form-control-sm cell-input"
          style={cellStyle}
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        className="form-control form-control-sm cell-input"
        style={cellStyle}
      />
    );
  }
);

// Helper functions for column sizing and formatting
const getColumnWidth = (field: MetadataFieldDef): string => {
  // Base width on content type and field characteristics
  const fieldName = field.name;
  const hasLongOptions =
    field.options && field.options.some((opt) => opt.length > 20);
  const isDropdown = field.inputMode === 'dropdown';

  if (
    fieldName.includes('empo_') ||
    fieldName === 'mid' ||
    fieldName.length <= 8
  ) {
    return '8rem';
  }

  if (fieldName.length <= 15 && !hasLongOptions) {
    return '10rem';
  }

  if (hasLongOptions || fieldName.length > 15 || isDropdown) {
    return '12rem';
  }

  return '10rem';
};

const formatFieldName = (field: MetadataFieldDef): string => {
  // Use the display name from the field definition if available
  return field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const createTooltipText = (field: MetadataFieldDef): string => {
  const parts = [];

  if (field.definition) {
    parts.push(`Definition: ${field.definition}`);
  }

  if (field.example) {
    parts.push(`Example: ${field.example}`);
  }

  if (field.required) {
    parts.push('⚠️ Required field');
  }

  if (
    field.inputMode === 'dropdown' &&
    field.options &&
    field.options.length > 0
  ) {
    if (field.options.length <= 5) {
      parts.push(`Options: ${field.options.join(', ')}`);
    } else {
      parts.push(
        `Options: ${field.options.slice(0, 3).join(', ')} ... (${
          field.options.length
        } total)`
      );
    }
  }

  return parts.join('\n\n');
};

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
}

const SampleSetFields: React.FC<SampleSetFieldsProps> = ({ setFields }) => {
  return (
    <div className={styles['main-form-container']}>
      <div className={styles.header}>
        <h4>Sample Set Information</h4>
        <small className="text-muted">
          These fields apply to all samples in this batch
        </small>
      </div>
      <div className="row">
        {setFields.map((field) => (
          <div key={field.name} className="col-md-6 mb-3">
            <div className={styles['field-container']}>
              {field.inputMode === 'dropdown' ? (
                <FormikSelect
                  name={field.name}
                  label={field.name
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  required={field.required}
                  description={`Example: ${field.example}`}
                  labelClassName={styles['arg-label']}
                  className={styles['formik-select']}
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
                  label={field.name
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  required={field.required}
                  description={`Example: ${field.example}`}
                  labelClassName={styles['arg-label']}
                />
              )}
              <small className={`text-muted ${styles['definition-text']}`}>
                <strong>Definition:</strong> {field.definition}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface VirtualizedRow {
  index: number;
  style: React.CSSProperties;
  sampleFields: MetadataFieldDef[];
  sample: SampleData;
  onSampleChange: (rowIndex: number, fieldName: string, value: string) => void;
}

const TableRow: React.FC<VirtualizedRow> = React.memo(
  ({ index, style, sampleFields, sample, onSampleChange }) => {
    const hasData = useMemo(
      () => Object.values(sample).some((value) => value && value.trim() !== ''),
      [sample]
    );

    return (
      <tr style={style} className={hasData ? 'table-row-with-data' : ''}>
        {sampleFields.map((field) => (
          <td key={field.name} style={{ minWidth: getColumnWidth(field) }}>
            <CellEditor
              value={sample[field.name]}
              onChange={onSampleChange}
              field={field}
              rowIndex={index}
            />
          </td>
        ))}
      </tr>
    );
  }
);

interface InfiniteSampleTableProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  onSampleChange: (rowIndex: number, fieldName: string, value: string) => void;
  filledSampleCount: number;
}

const InfiniteSampleTable: React.FC<InfiniteSampleTableProps> = ({
  sampleFields,
  samples,
  onSampleChange,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Only render visible rows + buffer for better performance
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const BUFFER_SIZE = 10;

  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current) return;

    const container = tableContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const rowHeight = 35; // Approximate row height

    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(samples.length, start + visibleRows + BUFFER_SIZE * 2);

    setVisibleRange({ start, end });
  }, [samples.length]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleSamples = useMemo(
    () => samples.slice(visibleRange.start, visibleRange.end),
    [samples, visibleRange]
  );

  return (
    <div className={styles['main-form-container']}>
      <div className={styles.header}>
        <h4>Sample Data Spreadsheet</h4>
      </div>

      <div
        ref={tableContainerRef}
        className={styles['scrollable-table']}
        style={{
          maxHeight: '75vh',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        <table
          className="table table-striped table-hover table-sm"
          style={{
            minWidth: 'max-content',
            height: `${samples.length * 35}px`, // Virtual height
            position: 'relative',
          }}
        >
          <thead
            className="thead-light"
            style={{ position: 'sticky', top: 0, zIndex: 20 }}
          >
            <tr>
              {sampleFields.map((field, index) => (
                <th
                  key={field.name}
                  style={{
                    minWidth: getColumnWidth(field),
                    width: getColumnWidth(field),
                  }}
                  title={createTooltipText(field)}
                >
                  <div className="column-header">
                    <div className="field-name">
                      {formatFieldName(field)}
                      {field.required && (
                        <span className="text-danger"> *</span>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            style={{
              position: 'absolute',
              top: `${visibleRange.start * 35 + 40}px`, // Header height offset
              width: '100%',
            }}
          >
            {visibleSamples.map((sample, relativeIndex) => {
              const actualIndex = visibleRange.start + relativeIndex;
              return (
                <TableRow
                  key={actualIndex}
                  index={actualIndex}
                  style={{}}
                  sampleFields={sampleFields}
                  sample={sample}
                  onSampleChange={onSampleChange}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MetadataForm: React.FC = () => {
  const metadataFields = METADATA_FIELDS as MetadataFieldDef[];
  const setFields = getSetWideFields(metadataFields);
  const sampleFields = getSampleFields(metadataFields);

  const INITIAL_ROWS = 100;
  const BATCH_SIZE = 50;

  const [samples, setSamples] = useState<SampleData[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => createEmptySample(sampleFields))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimized filledSampleCount calculation with memoization
  const filledSampleCount = useMemo(() => {
    let count = 0;
    for (const sample of samples) {
      if (Object.values(sample).some((value) => value && value.trim() !== '')) {
        count++;
      }
      // Early termination if we've counted past reasonable limits
      if (count > 10000) break;
    }
    return count;
  }, [samples]);

  // Get only samples with data for export
  const samplesWithData = useMemo(() => {
    return samples.filter((sample) =>
      Object.values(sample).some((value) => value && value.trim() !== '')
    );
  }, [samples]);

  // Create initial values for Formik
  const initialValues = useMemo(() => {
    const values: any = {};

    // Initialize set-wide fields
    setFields.forEach((field) => {
      values[field.name] = '';
    });

    return values;
  }, [setFields]);

  const validationSchema = useMemo(() => {
    return createMultiSampleValidationSchema(setFields, sampleFields);
  }, [setFields, sampleFields]);

  // Sample change handler with batching
  const handleSampleChange = useCallback(
    (rowIndex: number, fieldName: string, value: string) => {
      setSamples((prev) => {
        // Use functional update to avoid stale closures
        const newSamples = [...prev];
        newSamples[rowIndex] = { ...newSamples[rowIndex], [fieldName]: value };

        // Add more rows less aggressively
        if (rowIndex > newSamples.length - 20) {
          const additionalRows = Array.from({ length: BATCH_SIZE }, () =>
            createEmptySample(sampleFields)
          );
          return [...newSamples, ...additionalRows];
        }

        return newSamples;
      });
    },
    [sampleFields, BATCH_SIZE]
  );

  const handleSubmit = async (values: any) => {
    if (samplesWithData.length === 0) {
      alert('Please enter data for at least one sample before generating CSV.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create set-wide fields object
      const setWideFields: { [key: string]: string } = {};
      setFields.forEach((field) => {
        setWideFields[field.name] = values[field.name] || '';
      });

      // Create multi-sample data structure with only filled samples
      const multiSampleData: MultiSampleMetadata = {
        setWideFields,
        samples: samplesWithData,
      };

      // Generate and download CSV
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

  const previewCSV = (values: any) => {
    const setWideFields: { [key: string]: string } = {};
    setFields.forEach((field) => {
      setWideFields[field.name] = values[field.name] || '';
    });

    console.log('Preview - Set-wide fields:', setWideFields);
    console.log('Preview - Samples with data:', samplesWithData);
    console.log('Preview - Total samples with data:', samplesWithData.length);
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
        {({ values, errors, touched }) => (
          <div>
            {/* Sample Set-Wide Fields Section */}
            <SampleSetFields setFields={setFields} />

            {/* Infinite Scroll Sample Table */}
            <InfiniteSampleTable
              sampleFields={sampleFields}
              samples={samples}
              onSampleChange={handleSampleChange}
              filledSampleCount={filledSampleCount}
            />

            {/* Submit Section */}
            <div className={styles['submit-controls']}>
              <div className="d-flex align-items-center gap-3">
                <div>
                  <div className="text-success font-weight-bold">
                    ✅ Ready to export {filledSampleCount} samples
                  </div>
                  <small className="text-muted">
                    Only rows with data will be included in the CSV
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
                  disabled={isSubmitting || filledSampleCount === 0}
                  onClick={() => handleSubmit(values)}
                >
                  {isSubmitting
                    ? 'Generating...'
                    : `Generate CSV (${filledSampleCount} samples)`}
                </Button>
              </div>
            </div>

            {/* Display validation errors for set-wide fields only */}
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
          </div>
        )}
      </Formik>
    </div>
  );
};

export default MetadataForm;
