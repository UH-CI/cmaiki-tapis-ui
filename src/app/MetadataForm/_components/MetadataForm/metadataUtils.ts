import * as Yup from 'yup';

// Updated types
export type MetadataFieldDef = {
  name: string;
  definition: string;
  example: string;
  required: boolean;
  type: string;
  inputMode?: 'text' | 'dropdown' | 'checkbox' | 'file' | 'fixed';
  options?: string[];
  scope?: 'set' | 'sample'; // NEW: indicates if field applies to entire set or individual samples
  notes?: { Info?: string; Hidden?: string; Optional?: string };
};

export type MetadataEntry = {
  field: string;
  value: string;
  required: boolean;
  isCustom?: boolean;
  customDescription?: string;
  include?: boolean;
  inputMode?: 'text' | 'dropdown' | 'checkbox' | 'file' | 'fixed';
  options?: string[];
  disabled?: boolean;
};

// NEW: Multi-sample types
export type SampleData = {
  [fieldName: string]: string;
};

export type MultiSampleMetadata = {
  // Sample set-wide fields
  setWideFields: { [fieldName: string]: string };
  // Individual sample data
  samples: SampleData[];
};

// Helper functions to categorize fields
export const getSetWideFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] => {
  return metadataFields.filter((field) => field.scope === 'set');
};

export const getSampleFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] => {
  return metadataFields.filter((field) => field.scope === 'sample');
};

// Validation schemas
export const metadataSchema = Yup.array(
  Yup.object({
    field: Yup.string().required('Please provide a field name'),
    value: Yup.string().when(['required', 'inputMode'], {
      is: (required: boolean, inputMode: string) =>
        required && inputMode !== 'checkbox',
      then: (schema) => schema.required('This field is required'),
      otherwise: (schema) => schema,
    }),
    required: Yup.boolean(),
    isCustom: Yup.boolean(),
    customDescription: Yup.string().when('isCustom', {
      is: true,
      then: (schema) =>
        schema.required('Please provide a description for custom fields'),
      otherwise: (schema) => schema,
    }),
    include: Yup.boolean(),
    inputMode: Yup.string().oneOf([
      'text',
      'dropdown',
      'checkbox',
      'file',
      'fixed',
    ]),
    options: Yup.array().of(Yup.string()),
    disabled: Yup.boolean(),
  })
);

// NEW: Multi-sample validation schema
export const createMultiSampleValidationSchema = (
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
) => {
  const setWideSchema: any = {};
  const sampleSchema: any = {};

  // Build set-wide validation
  setFields.forEach((field) => {
    if (field.required) {
      setWideSchema[field.name] = Yup.string().required(
        `${field.name} is required`
      );
    } else {
      setWideSchema[field.name] = Yup.string();
    }
  });

  // Build sample validation
  sampleFields.forEach((field) => {
    if (field.required) {
      sampleSchema[field.name] = Yup.string().required(
        `${field.name} is required`
      );
    } else {
      sampleSchema[field.name] = Yup.string();
    }
  });

  return Yup.object({
    ...setWideSchema,
    samples: Yup.array()
      .of(Yup.object(sampleSchema))
      .min(1, 'At least one sample is required'),
  });
};

// CSV generation utilities - UPDATED for multi-sample
export const generateMetadataCSV = (
  metadataEntries: MetadataEntry[]
): string => {
  if (metadataEntries.length === 0) return '';

  const headers = ['Metadata Term', 'Value', 'Input Type'];
  const rows = metadataEntries
    .filter((entry) => {
      if (!entry.field) return false;
      return entry.inputMode === 'checkbox'
        ? entry.include === true
        : entry.value !== undefined && entry.value !== '';
    })
    .map((entry) => [
      entry.field,
      entry.inputMode === 'checkbox'
        ? entry.include
          ? 'Yes'
          : 'No'
        : entry.value,
      entry.inputMode || 'text',
    ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
};

// NEW: Multi-sample CSV generation
export const generateMultiSampleCSV = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): string => {
  if (multiSampleData.samples.length === 0) return '';

  // Create headers: sample fields first, then set-wide fields
  const headers = [
    ...sampleFields.map((field) => field.name),
    ...setFields.map((field) => field.name),
  ];

  // Create rows: each sample with set-wide fields repeated
  const rows = multiSampleData.samples.map((sample) => [
    ...sampleFields.map((field) => sample[field.name] || ''),
    ...setFields.map(
      (field) => multiSampleData.setWideFields[field.name] || ''
    ),
  ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
};

export const downloadMetadataCSV = (
  metadataEntries: MetadataEntry[],
  filename: string = 'metadata.csv'
) => {
  const csvContent = generateMetadataCSV(metadataEntries);
  if (!csvContent) {
    alert('No metadata entries to download');
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// NEW: Multi-sample CSV download
export const downloadMultiSampleCSV = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  filename: string = 'multi_sample_metadata.csv'
) => {
  const csvContent = generateMultiSampleCSV(
    multiSampleData,
    setFields,
    sampleFields
  );
  if (!csvContent) {
    alert('No sample data to download');
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to create empty sample
export const createEmptySample = (
  sampleFields: MetadataFieldDef[]
): SampleData => {
  const emptySample: SampleData = {};
  sampleFields.forEach((field) => {
    emptySample[field.name] = '';
  });
  return emptySample;
};

// Helper function to update entry required status (keep for backward compatibility)
export const updateEntryRequiredStatus = (
  entry: MetadataEntry,
  metadataFields: MetadataFieldDef[]
): MetadataEntry => {
  if (entry.isCustom) return { ...entry, required: false };

  const fieldDef = metadataFields.find((f) => f.name === entry.field);
  return { ...entry, required: fieldDef?.required ?? false };
};
