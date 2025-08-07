import * as Yup from 'yup';

// Types
export type MetadataFieldDef = {
  name: string;
  definition: string;
  example: string;
  required: boolean;
  type: string;
  inputMode?: 'text' | 'dropdown' | 'checkbox' | 'file' | 'fixed';
  options?: string[];
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

// Validation schema
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

// CSV generation utilities
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

// Helper function to update entry required status
export const updateEntryRequiredStatus = (
  entry: MetadataEntry,
  metadataFields: MetadataFieldDef[]
): MetadataEntry => {
  if (entry.isCustom) return { ...entry, required: false };

  const fieldDef = metadataFields.find((f) => f.name === entry.field);
  return { ...entry, required: fieldDef?.required ?? false };
};
