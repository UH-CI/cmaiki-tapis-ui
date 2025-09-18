import React, { useMemo } from 'react';
import { GridColDef, GridRowId } from '@mui/x-data-grid';
import {
  MetadataFieldDef,
  SampleData,
  shouldShowField,
  getDynamicOptions,
} from '../metadataUtils';
import { DragFillHandle } from '../components/DragFillHandle';

// Field groupings with color assignments
const FIELD_GROUPS = {
  SAMPLE_IDENTIFIERS: {
    fields: ['samp_name', 'project_name'],
    color: '#d4edda', // Green
  },
  COLLECTION_EVENT: {
    fields: [
      'collection_date',
      'collection_date_end',
      'geo_loc_name',
      'lat_lon',
      'investigator',
    ],
    color: '#d1ecf1', // Blue
  },
  SAMPLE_DESCRIPTION: {
    fields: [
      'samp_type',
      'samp_mat_process',
      'empo_1',
      'empo_2',
      'empo_3',
      'specific_host',
      'host_common_name',
      'host_diet',
      'env_broad_scale',
      'env_local_scale',
      'env_medium',
    ],
    color: '#fff3cd', // Pale yellow
  },
  NUCLEIC_ACID_EXTRACTION: {
    fields: [
      'nucl_acid_ext',
      'pcr_primers',
      'mid',
      'adapters',
      'target_gene',
      'lib_layout',
    ],
    color: '#e2e3e5', // Grayish blue
  },
  SEQUENCING_RUN: {
    fields: ['sequencing_location', 'seq_meth', 'sequencing_kit'],
    color: '#f8d7da', // Pinkish red
  },
};

const getFieldGroupName = (fieldId: string): string => {
  for (const [groupName, group] of Object.entries(FIELD_GROUPS)) {
    if (group.fields.includes(fieldId)) {
      return groupName.toLowerCase().replace(/_/g, '-');
    }
  }
  return 'default';
};

interface UseDataGridColumnsProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  formValues: { [key: string]: string };
  onDragStart?: (rowId: GridRowId, field: string, value: string) => void;
  onDragOver?: (rowId: GridRowId, field: string) => void;
  onDragEnd?: () => void;
  isCellInDragSelection?: (rowId: GridRowId, field: string) => boolean;
}

export const useDataGridColumns = ({
  sampleFields,
  samples,
  formValues,
  onDragStart,
  onDragOver,
  onDragEnd,
  isCellInDragSelection,
}: UseDataGridColumnsProps): GridColDef[] => {
  return useMemo(
    () =>
      sampleFields.map((field) => {
        const baseColumn: GridColDef = {
          field: field.field_id,
          renderHeader: () => {
            return React.createElement(
              'span',
              {
                style: {
                  fontWeight: field.required ? 700 : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                },
              },
              [
                React.createElement(
                  'span',
                  {
                    key: 'field-name',
                  },
                  field.field_name
                ),
                field.required &&
                  React.createElement(
                    'span',
                    {
                      key: 'asterisk',
                      style: {
                        color: '#dc3545',
                        fontSize: '1.2em',
                        marginLeft: '4px',
                        fontWeight: 'bold',
                      },
                    },
                    ' *'
                  ),
              ]
            );
          },
          width: Math.max(120, Math.min(200, field.field_name.length * 12)),
          editable: true,
          type: field.input_type === 'dropdown' ? 'singleSelect' : 'string',
          headerClassName: `group-${getFieldGroupName(field.field_id)}`,
          renderEditCell:
            field.input_type === 'date'
              ? (params: any) => {
                  if (!params || !params.row) return null;

                  const formatDateInput = (value: string) => {
                    // Remove all non-digits
                    const digits = value.replace(/\D/g, '');

                    // Format as MM/DD/YYYY
                    if (digits.length >= 8) {
                      return `${digits.slice(0, 2)}/${digits.slice(
                        2,
                        4
                      )}/${digits.slice(4, 8)}`;
                    } else if (digits.length >= 4) {
                      return `${digits.slice(0, 2)}/${digits.slice(
                        2,
                        4
                      )}/${digits.slice(4)}`;
                    } else if (digits.length >= 2) {
                      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
                    }
                    return digits;
                  };

                  return React.createElement('input', {
                    type: 'text',
                    value: params.value || '',
                    placeholder: 'MM/DD/YYYY',
                    maxLength: 10,
                    onChange: (e: any) => {
                      const formatted = formatDateInput(e.target.value);
                      params.api.setEditCellValue({
                        id: params.id,
                        field: params.field,
                        value: formatted,
                      });
                    },
                    onKeyDown: (e: any) => {
                      // Allow backspace, delete, tab, escape, enter, and arrow keys
                      if (
                        [8, 9, 27, 13, 37, 38, 39, 40, 46].includes(e.keyCode)
                      ) {
                        return;
                      }
                      // Allow digits only
                      if (e.keyCode < 48 || e.keyCode > 57) {
                        e.preventDefault();
                      }
                    },
                    style: {
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      padding: '4px',
                    },
                  });
                }
              : undefined,
          renderCell: (params) => {
            const rowData = samples[Number(params.id) - 1] || {};
            const combinedValues = { ...formValues, ...rowData };
            const isVisible = shouldShowField(field, combinedValues);

            if (!isVisible) {
              return 'N/A';
            }

            const cellValue = params.value?.toString() || '';
            const isInDragSelection =
              isCellInDragSelection?.(params.id, params.field) || false;

            return React.createElement(
              'div',
              {
                style: {
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isInDragSelection
                    ? 'rgba(25, 118, 210, 0.1)'
                    : 'transparent',
                  border: isInDragSelection ? '1px solid #1976d2' : 'none',
                },
                onDragOver: (e: any) => {
                  e.preventDefault();
                  onDragOver?.(params.id, params.field);
                },
                onDrop: (e: any) => {
                  e.preventDefault();
                  onDragEnd?.();
                },
              },
              [
                React.createElement(
                  'span',
                  { key: 'cell-content' },
                  cellValue ||
                    (field.input_type === 'dropdown' ? 'Select...' : '')
                ),
                cellValue &&
                  onDragStart &&
                  onDragOver &&
                  onDragEnd &&
                  React.createElement(DragFillHandle, {
                    key: 'drag-handle',
                    rowId: params.id,
                    field: params.field,
                    value: cellValue,
                    onDragStart,
                    onDragOver,
                    onDragEnd,
                    isVisible: true,
                  }),
              ].filter(Boolean)
            );
          },
        };

        // Add dropdown-specific properties
        if (field.input_type === 'dropdown') {
          return {
            ...baseColumn,
            valueOptions: (params: any) => {
              const rowData = samples[Number(params.id) - 1] || {};
              const combinedValues = { ...formValues, ...rowData };
              const isVisible = shouldShowField(field, combinedValues);

              if (!isVisible) return [];
              return getDynamicOptions(field, combinedValues);
            },
          };
        }

        return baseColumn;
      }),
    [
      sampleFields,
      formValues,
      samples,
      onDragStart,
      onDragOver,
      onDragEnd,
      isCellInDragSelection,
    ]
  );
};
