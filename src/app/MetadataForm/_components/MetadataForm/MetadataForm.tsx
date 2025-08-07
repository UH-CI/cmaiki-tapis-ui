import React, { useMemo, useState } from 'react';
import {
  FieldArray,
  useField,
  FieldArrayRenderProps,
  Formik,
  Form,
} from 'formik';
import { Button } from 'reactstrap';
import styles from './MetadataForm.module.scss';
import {
  FormikInput,
  FormikSelect,
  FormikCheck,
  FormikTapisFile,
} from '@tapis/tapisui-common';
import * as Yup from 'yup';
import METADATA_FIELDS from './metadataFields.json';
import {
  type MetadataFieldDef,
  type MetadataEntry,
  metadataSchema,
  generateMetadataCSV,
  downloadMetadataCSV,
  updateEntryRequiredStatus,
} from './metadataUtils';

const FieldInput: React.FC<{
  name: string;
  fieldDef?: MetadataFieldDef;
  isCustom: boolean;
  inputMode: string;
  required: boolean;
  options: string[];
  customDescription: string;
  disabled: boolean;
}> = ({
  name,
  fieldDef,
  isCustom,
  inputMode,
  required,
  options,
  customDescription,
  disabled,
}) => {
  const baseProps = {
    required: required && !isCustom,
    labelClassName: styles['arg-label'],
    description: fieldDef ? `Example: ${fieldDef.example}` : '',
    infoText: fieldDef?.notes?.Info || '',
  };

  const label = fieldDef?.name ?? name.split('.').pop() ?? 'Unknown Field';

  switch (inputMode) {
    case 'dropdown':
      return (
        <FormikSelect
          name={`${name}.value`}
          label={label}
          {...baseProps}
          className={styles['formik-select']}
        >
          <option value="">Select an option...</option>
          {(options || fieldDef?.options || []).map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormikSelect>
      );

    case 'checkbox':
      return (
        <FormikCheck
          name={`${name}.include`}
          required={false}
          label={label}
          description=""
          infoText={fieldDef?.notes?.Info || ''}
          labelClassName={styles['checkbox-label']}
          tooltipText={fieldDef?.definition || customDescription}
        />
      );

    case 'file':
      return (
        <FormikTapisFile
          name={`${name}.value`}
          label={label}
          required={required && !isCustom}
          description={
            fieldDef?.definition ||
            customDescription ||
            'Select a file as pathname, TAPIS URI or web URL'
          }
        />
      );

    case 'fixed':
      return (
        <FormikInput
          name={`${name}.value`}
          label={label}
          {...baseProps}
          disabled={true}
        />
      );

    default:
      return (
        <FormikInput
          name={`${name}.value`}
          label={label}
          {...baseProps}
          disabled={disabled}
        />
      );
  }
};

const CustomFieldConfig: React.FC<{
  name: string;
  onOptionsChange: (options: string[]) => void;
}> = ({ name, onOptionsChange }) => {
  const [inputModeField] = useField(`${name}.inputMode`);

  return (
    <>
      <FormikInput
        name={`${name}.field`}
        label="Field Name"
        required={false}
        description="Enter a custom field name"
        labelClassName={styles['arg-label']}
      />
      <FormikInput
        name={`${name}.customDescription`}
        label="Field Description"
        required={false}
        description="Enter a description for this custom field"
        labelClassName={styles['arg-label']}
      />
      <FormikSelect
        name={`${name}.inputMode`}
        label="Input Type"
        required={false}
        description="Choose the input type for this field"
        labelClassName={styles['arg-label']}
      >
        <option value="text">Text Input</option>
        <option value="dropdown">Dropdown</option>
        <option value="checkbox">Checkbox</option>
        <option value="file">File Upload</option>
        <option value="fixed">Fixed Value</option>
      </FormikSelect>

      {inputModeField.value === 'dropdown' && (
        <div className="form-group">
          <label className={styles['arg-label']}>Dropdown Options</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter comma-separated options"
            onChange={(e) => {
              const options = e.target.value
                .split(',')
                .map((opt) => opt.trim())
                .filter((opt) => opt);
              onOptionsChange(options);
            }}
          />
          <small className="form-text text-muted">
            Enter comma-separated options for the dropdown
          </small>
        </div>
      )}
    </>
  );
};

const MetadataField: React.FC<{
  index: number;
  name: string;
  arrayHelpers: FieldArrayRenderProps;
}> = ({ name, index, arrayHelpers }) => {
  const [fieldNameField] = useField(`${name}.field`);
  const [requiredField] = useField(`${name}.required`);
  const [isCustomField] = useField(`${name}.isCustom`);
  const [customDescriptionField] = useField(`${name}.customDescription`);
  const [inputModeField] = useField(`${name}.inputMode`);
  const [optionsField, , optionsHelpers] = useField(`${name}.options`);
  const [disabledField] = useField(`${name}.disabled`);

  const fieldDef = (METADATA_FIELDS as MetadataFieldDef[]).find(
    (f) => f.name === fieldNameField.value
  );
  const isCustom = isCustomField.value;
  const inputMode = inputModeField.value || fieldDef?.inputMode || 'text';

  if (isCustom) {
    return (
      <div className={`${styles['field-container']} ${styles['custom-field']}`}>
        <CustomFieldConfig
          name={name}
          onOptionsChange={(options) => optionsHelpers.setValue(options)}
        />

        <FieldInput
          name={name}
          fieldDef={fieldDef}
          isCustom={isCustom}
          inputMode={inputMode}
          required={requiredField.value}
          options={optionsField.value}
          customDescription={customDescriptionField.value}
          disabled={disabledField.value}
        />

        <Button
          color="danger"
          size="sm"
          onClick={() => arrayHelpers.remove(index)}
          className={styles['remove-button']}
        >
          Remove Custom Field
        </Button>

        {customDescriptionField.value && (
          <small className={`text-muted ${styles['definition-text']}`}>
            <strong>Definition:</strong> {customDescriptionField.value}
          </small>
        )}
      </div>
    );
  }

  return (
    <div className={styles['field-container']}>
      <FieldInput
        name={name}
        fieldDef={fieldDef}
        isCustom={isCustom}
        inputMode={inputMode}
        required={requiredField.value}
        options={optionsField.value}
        customDescription={customDescriptionField.value}
        disabled={disabledField.value}
      />

      {fieldDef && (
        <small className={`text-muted ${styles['definition-text']}`}>
          <strong>Definition:</strong> {fieldDef.definition}
        </small>
      )}
    </div>
  );
};

const MetadataFieldArray: React.FC<{ name: string }> = ({ name }) => {
  const [field] = useField(name);
  const metadataEntries = useMemo(
    () => (field.value as Array<MetadataEntry>) ?? [],
    [field]
  );

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <div className={styles.array}>
          <div className={styles.header}>
            <h3>Metadata Fields</h3>
            <span className={styles.counter}>
              {metadataEntries.length} Fields
            </span>
          </div>
          <div className={styles.description}>
            Define metadata fields and their values. This will generate a CSV
            file upon submission. All predefined fields are shown below -
            required fields are marked as such. You can also add custom fields
            if needed.
          </div>

          <div className={styles['array-group']}>
            {metadataEntries.map((entry, index) => (
              <MetadataField
                key={`${name}-${index}`}
                index={index}
                arrayHelpers={arrayHelpers}
                name={`${name}.${index}`}
              />
            ))}
          </div>

          <div className={styles['add-field-controls']}>
            <Button
              type="button"
              color="primary"
              size="sm"
              onClick={() =>
                arrayHelpers.push({
                  field: '',
                  value: '',
                  required: false,
                  isCustom: true,
                  customDescription: '',
                  include: undefined,
                  inputMode: 'text',
                  options: [],
                  disabled: false,
                })
              }
            >
              Add Custom Field
            </Button>
          </div>
        </div>
      )}
    />
  );
};

const MetadataForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    metadataEntries: (METADATA_FIELDS as MetadataFieldDef[]).map((field) => ({
      field: field.name,
      value: field.inputMode === 'checkbox' ? false : '',
      required: field.required,
      isCustom: false,
      customDescription: '',
      include: field.inputMode === 'checkbox' ? false : undefined,
      inputMode: field.inputMode || 'text',
      options: field.options || [],
      disabled: field.inputMode === 'fixed',
    })) as MetadataEntry[],
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSubmitting(true);
    try {
      const updatedEntries = values.metadataEntries.map((entry) =>
        updateEntryRequiredStatus(entry, METADATA_FIELDS as MetadataFieldDef[])
      );
      downloadMetadataCSV(updatedEntries);
      console.log('Metadata CSV generated successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewCSV = (entries: MetadataEntry[]) => {
    const updatedEntries = entries.map((entry) =>
      updateEntryRequiredStatus(entry, METADATA_FIELDS as MetadataFieldDef[])
    );
    console.log('Preview:', generateMetadataCSV(updatedEntries));
  };

  return (
    <div className={styles['main-form-container']}>
      <Formik
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          metadataEntries: metadataSchema,
        })}
        onSubmit={handleSubmit}
      >
        {({ values }) => (
          <Form>
            <MetadataFieldArray name="metadataEntries" />
            <div className={styles['submit-controls']}>
              <Button type="submit" color="success" disabled={isSubmitting}>
                {isSubmitting ? 'Generating...' : 'Generate CSV'}
              </Button>
              <Button
                type="button"
                color="info"
                onClick={() => previewCSV(values.metadataEntries)}
              >
                Preview CSV
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default MetadataForm;
