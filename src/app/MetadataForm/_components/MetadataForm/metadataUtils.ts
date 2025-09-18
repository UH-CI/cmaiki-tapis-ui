import * as Yup from 'yup';

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
  };
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
const SET_WIDE_FIELD_IDS = ['project_name', 'investigator'];

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

// Helper function to check if a field should be visible based on conditions
export const shouldShowField = (
  field: MetadataFieldDef,
  formValues: { [key: string]: string }
): boolean => {
  if (!field.show_condition) return true;

  const { field: conditionField, operator, value } = field.show_condition;
  const fieldValue = formValues[conditionField];

  switch (operator) {
    case '=':
      return fieldValue === value;
    case '!=':
      return fieldValue !== value;
    case '>':
      return fieldValue > value;
    case '<':
      return fieldValue < value;
    case '>=':
      return fieldValue >= value;
    case '<=':
      return fieldValue <= value;
    default:
      return true;
  }
};

// Helper function to get dynamic options for a field
export const getDynamicOptions = (
  field: MetadataFieldDef,
  formValues: { [key: string]: string }
): string[] => {
  if (!field.dynamic_options) return field.options || [];

  const { based_on, option_map } = field.dynamic_options;
  const baseFieldValue = formValues[based_on];

  return option_map[baseFieldValue] || [];
};

export const createMultiSampleValidationSchema = (
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  schema?: MetadataSchema
) => {
  const setWideSchema: Record<string, Yup.StringSchema> = {};

  setFields.forEach((field) => {
    let validator = Yup.string();

    if (field.required) {
      validator = validator.required(`${field.field_name} is required`);
    }

    setWideSchema[field.field_id] = validator;
  });

  const sampleSchema: any = {};
  sampleFields.forEach((field) => {
    let validator: any = Yup.string();

    if (!field.required) {
      validator = validator.nullable();
    }

    if (field.validation.minLength) {
      validator = validator.min(
        field.validation.minLength,
        `${field.field_name} must be at least ${field.validation.minLength} characters`
      );
    }

    if (field.validation.maxLength) {
      validator = validator.max(
        field.validation.maxLength,
        `${field.field_name} must be no more than ${field.validation.maxLength} characters`
      );
    }

    if (field.validation.pattern) {
      validator = validator.matches(
        new RegExp(field.validation.pattern),
        `${field.field_name} format is invalid`
      );
    }

    if (field.validation.unique) {
      validator = validator.test(
        'unique',
        `${field.field_name} must be unique across all samples`,
        function (this: any, value: any) {
          if (!value) return true;

          const allData = this.from?.[1]?.value || {};
          const samples = allData.samples || [];

          // Find current sample index
          const currentPath = this.path;
          const currentIndex = parseInt(
            currentPath.match(/samples\[(\d+)\]/)?.[1] || '0'
          );

          return !samples.some(
            (sample: any, index: number) =>
              index !== currentIndex && sample[field.field_id] === value
          );
        }
      );
    }

    if (field.required) {
      validator = validator.required(`${field.field_name} is required`);
    }

    sampleSchema[field.field_id] = validator;
  });

  return Yup.object({
    ...setWideSchema,
    samples: Yup.array()
      .of(Yup.object(sampleSchema))
      .min(1, 'At least one sample is required'),
  });
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
