import React, { useMemo } from 'react';
import { FormikInput } from '@tapis/tapisui-common';
import styles from '../MetadataForm.module.scss';
import { MetadataFieldDef } from '../metadataUtils';

interface SampleSetFieldsProps {
  setFields: MetadataFieldDef[];
  formValues: { [key: string]: string };
  shouldShowField: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => boolean;
}

const FIELD_GROUPS: {
  [groupKey: string]: {
    header: string;
    fieldIds: string[];
  };
} = {
  point_of_contact: {
    header: 'Contact Information for Primary Point of Contact',
    fieldIds: ['point_of_contact', 'point_of_contact_email'],
  },
  secondary_point_of_contact: {
    header: 'Contact Information for Secondary Point of Contact',
    fieldIds: [
      'secondary_point_of_contact',
      'secondary_point_of_contact_email',
    ],
  },
  sequencing_point_of_contact: {
    header: 'Contact Information for Sequencing Point of Contact',
    fieldIds: [
      'sequencing_point_of_contact',
      'sequencing_point_of_contact_email',
    ],
  },
};

export const SampleSetFields: React.FC<SampleSetFieldsProps> = React.memo(
  ({ setFields, formValues, shouldShowField }) => {
    // Memoize filtered fields to prevent unnecessary re-filtering
    const visibleFields = useMemo(
      () => setFields.filter((field) => shouldShowField(field, formValues)),
      [setFields, formValues, shouldShowField]
    );

    const { groupedFields, individualFields } = useMemo(() => {
      const grouped: Array<{
        groupKey: string;
        header: string;
        fields: MetadataFieldDef[];
      }> = [];
      const standalone: MetadataFieldDef[] = [];
      const processedFieldIds = new Set<string>();

      // Process each group
      Object.entries(FIELD_GROUPS).forEach(([groupKey, groupConfig]) => {
        const groupFields = visibleFields.filter(
          (field) =>
            groupConfig.fieldIds.includes(field.field_id) &&
            shouldShowField(field, formValues)
        );

        if (groupFields.length > 0) {
          grouped.push({
            groupKey,
            header: groupConfig.header,
            fields: groupFields,
          });
          groupFields.forEach((field) => processedFieldIds.add(field.field_id));
        }
      });

      visibleFields.forEach((field) => {
        if (!processedFieldIds.has(field.field_id)) {
          standalone.push(field);
        }
      });

      return { groupedFields: grouped, individualFields: standalone };
    }, [visibleFields, formValues, shouldShowField]);

    return (
      <div className={styles['main-form-container']}>
        <div className={styles['fields-grid']}>
          {individualFields.map((field) => (
            <div key={field.field_id} className={styles['field-column']}>
              <FormikInput
                name={field.field_id}
                label={field.field_name}
                required={field.required}
                description={field.example ? `Example: ${field.example}` : ''}
                infoText={field.definition}
                labelClassName={styles['arg-label']}
              />
            </div>
          ))}
          {groupedFields.map((group) => (
            <div key={group.groupKey} className={styles['field-group']}>
              <h3 className={styles['field-group-header']}>{group.header}</h3>
              <div className={styles['field-group-content']}>
                {group.fields.map((field) => (
                  <div key={field.field_id} className={styles['field-column']}>
                    <FormikInput
                      name={field.field_id}
                      label={field.field_name}
                      required={field.required}
                      description={
                        field.example ? `Example: ${field.example}` : ''
                      }
                      infoText={field.definition}
                      labelClassName={styles['arg-label']}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SampleSetFields.displayName = 'SampleSetFields';
