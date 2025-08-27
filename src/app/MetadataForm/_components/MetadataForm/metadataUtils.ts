import * as Yup from 'yup';

export type MetadataFieldDef = {
  name: string;
  definition: string;
  example: string;
  required: boolean;
  type: string;
  inputMode?: 'text' | 'dropdown' | 'checkbox' | 'file' | 'fixed';
  options?: string[];
  scope?: 'set' | 'sample';
  notes?: { Info?: string; Hidden?: string; Optional?: string };
};

export type SampleData = {
  [fieldName: string]: string;
};

export type MultiSampleMetadata = {
  setWideFields: { [fieldName: string]: string };
  samples: SampleData[];
};

// Helper functions
export const getSetWideFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] =>
  metadataFields.filter((field) => field.scope === 'set');

export const getSampleFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] =>
  metadataFields.filter((field) => field.scope === 'sample');

export const createEmptySample = (
  sampleFields: MetadataFieldDef[]
): SampleData => {
  const emptySample: SampleData = {};
  sampleFields.forEach((field) => {
    emptySample[field.name] = '';
  });
  return emptySample;
};

// Simplified validation schema
export const createMultiSampleValidationSchema = (
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
) => {
  const setWideSchema: any = {};

  setFields.forEach((field) => {
    setWideSchema[field.name] = field.required
      ? Yup.string().required(`${field.name} is required`)
      : Yup.string();
  });

  return Yup.object({
    ...setWideSchema,
    samples: Yup.array().min(1, 'At least one sample is required'),
  });
};

// Simplified CSV generation
export const generateMultiSampleCSV = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): string => {
  if (multiSampleData.samples.length === 0) return '';

  const headers = [
    ...sampleFields.map((field) => field.name),
    ...setFields.map((field) => field.name),
  ];

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
