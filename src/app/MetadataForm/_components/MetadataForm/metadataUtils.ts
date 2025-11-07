export type MetadataFieldDef = {
  field_id: string;
  field_name: string;
  term_id?: string;
  definition: string;
  input_type: 'text' | 'dropdown' | 'date' | 'checkbox' | 'file';
  example?: string;
  required: boolean;
  single_value?: boolean;
  options?: string[];
  dynamic_options?: {
    based_on: string;
    option_map: { [key: string]: string[] };
  };
  show_condition?: {
    type: 'field_value';
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
  };
  triggers?: string[];
  validation: {
    type: 'string' | 'date' | 'enum';
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    unique?: boolean;
    custom_rules?: string[];
    conditional_required?: boolean;
  };
  validation_description?: string;
};

export type MetadataSchema = {
  schema_name: string;
  version: string;
  description: string;
  fields: MetadataFieldDef[];
  custom_validators?: {
    [key: string]: {
      type: string;
      compare_field?: string;
      operator?: string;
    };
  };
};

export type SampleData = {
  [fieldName: string]: string;
};

export type MultiSampleMetadata = {
  setWideFields: { [fieldName: string]: string };
  samples: SampleData[];
};

// Helper functions - determine field categorization based on field characteristics
// Set-wide fields are project-level metadata that applies to all samples
const SET_WIDE_FIELD_IDS = [
  'project_name',
  'project_description',
  'point_of_contact',
  'point_of_contact_email',
  'secondary_point_of_contact',
  'secondary_point_of_contact_email',
  'sequencing_point_of_contact',
  'sequencing_point_of_contact_email',
];

export const getSetWideFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] =>
  metadataFields.filter((field) => SET_WIDE_FIELD_IDS.includes(field.field_id));

export const getSampleFields = (
  metadataFields: MetadataFieldDef[]
): MetadataFieldDef[] =>
  metadataFields.filter(
    (field) => !SET_WIDE_FIELD_IDS.includes(field.field_id)
  );

export const createEmptySample = (
  sampleFields: MetadataFieldDef[]
): SampleData => {
  const emptySample: SampleData = {};
  sampleFields.forEach((field) => {
    emptySample[field.field_id] = '';
  });
  return emptySample;
};

export const downloadMetadataCSV = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  filename?: string
) => {
  const csvFilename =
    filename || `${multiSampleData.setWideFields.project_name}_metadata.csv`;

  const headers = [
    ...sampleFields.map((field) => field.field_id),
    ...setFields.map((field) => field.field_id),
  ];

  const rows = multiSampleData.samples.map((sample) => [
    ...sampleFields.map((field) => sample[field.field_id] || ''),
    ...setFields.map(
      (field) => multiSampleData.setWideFields[field.field_id] || ''
    ),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', csvFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
