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
  hasError?: boolean;
  errorMessage?: string;
}

const CellEditor: React.FC<CellEditorProps> = React.memo(
  ({ value, onChange, field, rowIndex, hasError, errorMessage }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => setLocalValue(value || ''), [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () => onChange(rowIndex, field.name, newValue),
          150
        );
      },
      [onChange, rowIndex, field.name]
    );

    useEffect(
      () => () => timeoutRef.current && clearTimeout(timeoutRef.current),
      []
    );

    const inputProps = {
      value: localValue,
      onChange: handleChange,
      className: `${styles.cellInput} ${hasError ? styles.hasError : ''}`,
      title: hasError ? errorMessage : undefined,
    };

    return (
      <div className={styles.cellWrapper}>
        {field.inputMode === 'dropdown' ? (
          <select {...inputProps}>
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" {...inputProps} />
        )}
        {hasError && <small className={styles.errorText}>{errorMessage}</small>}
      </div>
    );
  }
);

// Helper functions
const getColumnWidth = (field: MetadataFieldDef): string => {
  if (
    field.name.includes('empo_') ||
    field.name === 'mid' ||
    field.name.length <= 8
  )
    return '8rem';
  if (field.name.length <= 15 && !field.options?.some((opt) => opt.length > 20))
    return '10rem';
  return '12rem';
};

const formatFieldName = (field: MetadataFieldDef): string =>
  field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const createTooltipText = (field: MetadataFieldDef): string => {
  const parts = [];
  if (field.definition) parts.push(`Definition: ${field.definition}`);
  if (field.example) parts.push(`Example: ${field.example}`);
  if (field.required) parts.push('★ Required field');
  if (field.inputMode === 'dropdown' && field.options?.length) {
    const options =
      field.options.length <= 5
        ? field.options.join(', ')
        : `${field.options.slice(0, 3).join(', ')} ... (${
            field.options.length
          } total)`;
    parts.push(`Options: ${options}`);
  }
  return parts.join('\n\n');
};

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
}

const SampleSetFields: React.FC<SampleSetFieldsProps> = ({ setFields }) => (
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

interface TableRowProps {
  index: number;
  sampleFields: MetadataFieldDef[];
  sample: SampleData;
  onSampleChange: (rowIndex: number, fieldName: string, value: string) => void;
  validationErrors?: { [fieldName: string]: string };
}

const TableRow: React.FC<TableRowProps> = React.memo(
  ({ index, sampleFields, sample, onSampleChange, validationErrors }) => {
    const hasData = useMemo(
      () => Object.values(sample).some((value) => value?.trim()),
      [sample]
    );

    return (
      <tr className={hasData ? styles.tableRowWithData : ''}>
        {sampleFields.map((field) => {
          const fieldError = validationErrors?.[field.name];
          return (
            <td key={field.name} style={{ minWidth: getColumnWidth(field) }}>
              <CellEditor
                value={sample[field.name]}
                onChange={onSampleChange}
                field={field}
                rowIndex={index}
                hasError={!!fieldError}
                errorMessage={fieldError}
              />
            </td>
          );
        })}
      </tr>
    );
  }
);

interface InfiniteSampleTableProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  onSampleChange: (rowIndex: number, fieldName: string, value: string) => void;
  filledSampleCount: number;
  validationErrors: { [rowIndex: number]: { [fieldName: string]: string } };
}

const InfiniteSampleTable: React.FC<InfiniteSampleTableProps> = ({
  sampleFields,
  samples,
  onSampleChange,
  filledSampleCount,
  validationErrors,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const BUFFER_SIZE = 10;

  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const { scrollTop, clientHeight } = container;
    const rowHeight = 35;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE);
    const visibleRows = Math.ceil(clientHeight / rowHeight);
    const end = Math.min(samples.length, start + visibleRows + BUFFER_SIZE * 2);

    setVisibleRange({ start, end });
  }, [samples.length]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleSamples = useMemo(
    () => samples.slice(visibleRange.start, visibleRange.end),
    [samples, visibleRange]
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

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className={styles.counter}>
            {filledSampleCount} samples with data
          </span>
          {totalValidationErrors > 0 && (
            <span className="badge badge-danger">
              {totalValidationErrors} validation errors
            </span>
          )}
        </div>
      </div>

      <div ref={tableContainerRef} className={styles.scrollableTable}>
        <table
          className={styles.virtualTable}
          style={{ height: `${samples.length * 35}px` }}
        >
          <thead>
            <tr>
              {sampleFields.map((field) => (
                <th
                  key={field.name}
                  style={{
                    minWidth: getColumnWidth(field),
                    width: getColumnWidth(field),
                  }}
                  title={createTooltipText(field)}
                >
                  <div className={styles.columnHeader}>
                    <div className={styles.fieldName}>
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
          <tbody style={{ top: `${visibleRange.start * 35 + 40}px` }}>
            {visibleSamples.map((sample, relativeIndex) => {
              const actualIndex = visibleRange.start + relativeIndex;
              return (
                <TableRow
                  key={actualIndex}
                  index={actualIndex}
                  sampleFields={sampleFields}
                  sample={sample}
                  onSampleChange={onSampleChange}
                  validationErrors={validationErrors[actualIndex]}
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
        (acc, field) => ({
          ...acc,
          [field.name]: values[field.name] || '',
        }),
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

            <InfiniteSampleTable
              sampleFields={sampleFields}
              samples={samples}
              onSampleChange={handleSampleChange}
              filledSampleCount={filledSampleCount}
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
                      ? `⚠ ${filledSampleCount} samples (${totalValidationErrors} errors)`
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
