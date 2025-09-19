import React, { useMemo, useCallback, useRef } from 'react';
import { GridColDef, GridRowId } from '@mui/x-data-grid';
import { Box, Typography, TextField } from '@mui/material';
import { MetadataFieldDef, SampleData } from '../metadataUtils';
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
  shouldShowField: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => boolean;
  getDynamicOptions: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => string[];
  formatDateInput: (value: string) => string;
}

// Helper component for date input formatting
const DateEditCell: React.FC<{
  params: any;
  formatDateInput: (value: string) => string;
}> = ({ params, formatDateInput }) => {
  if (!params || !params.row) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // For Tab and Enter, let the data grid handle navigation
    if (e.key === 'Tab' || e.key === 'Enter') {
      return; // Don't prevent default, let it bubble up
    }

    // Allow backspace, delete, escape, and arrow keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Only allow digits and prevent other characters
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <TextField
      type="text"
      value={params.value || ''}
      placeholder="YYYY-MM-DD"
      onChange={(e) => {
        const formatted = formatDateInput(e.target.value);
        params.api.setEditCellValue({
          id: params.id,
          field: params.field,
          value: formatted,
        });
      }}
      onKeyDown={handleKeyDown}
      variant="standard"
      size="small"
      fullWidth
      inputProps={{
        maxLength: 10,
        style: { padding: '4px' },
      }}
      sx={{
        '& .MuiInput-root': {
          '&:before, &:after': {
            display: 'none',
          },
        },
      }}
    />
  );
};

// Helper component for column headers
const ColumnHeader: React.FC<{ field: MetadataFieldDef }> = ({ field }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="flex-start"
    width="100%"
    sx={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'visible' }}
  >
    <Typography
      fontSize="0.8rem"
      fontWeight={field.required ? 700 : 'normal'}
      component="span"
    >
      {field.field_name}
      {field.required && (
        <Typography
          component="span"
          color="error.main"
          sx={{
            fontSize: '1.2em',
            ml: 0.5,
            fontWeight: 'bold',
          }}
        >
          *
        </Typography>
      )}
    </Typography>
  </Box>
);

// Helper component for cell content
const CellContent: React.FC<{
  params: any;
  field: MetadataFieldDef;
  samples: SampleData[];
  formValues: { [key: string]: string };
  onDragStart?: (rowId: GridRowId, field: string, value: string) => void;
  onDragOver?: (rowId: GridRowId, field: string) => void;
  onDragEnd?: () => void;
  isCellInDragSelection?: (rowId: GridRowId, field: string) => boolean;
  shouldShowField: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => boolean;
}> = ({
  params,
  field,
  samples,
  formValues,
  onDragStart,
  onDragOver,
  onDragEnd,
  isCellInDragSelection,
  shouldShowField,
}) => {
  const rowData = samples[Number(params.id) - 1] || {};
  const combinedValues = { ...formValues, ...rowData };
  const isVisible = shouldShowField(field, combinedValues);

  if (!isVisible) {
    return (
      <Typography variant="body2" color="text.disabled">
        N/A
      </Typography>
    );
  }

  const cellValue = params.value?.toString() || '';
  const isInDragSelection =
    isCellInDragSelection?.(params.id, params.field) || false;

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      sx={{
        backgroundColor: isInDragSelection
          ? 'rgba(25, 118, 210, 0.1)'
          : 'transparent',
        border: isInDragSelection ? '1px solid' : 'none',
        borderColor: 'primary.main',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(params.id, params.field);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd?.();
      }}
    >
      <Typography variant="body2" component="span">
        {cellValue || (field.input_type === 'dropdown' ? 'Select...' : '')}
      </Typography>

      {cellValue && onDragStart && onDragOver && onDragEnd && (
        <DragFillHandle
          rowId={params.id}
          field={params.field}
          value={cellValue}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          isVisible={true}
        />
      )}
    </Box>
  );
};

export const useDataGridColumns = ({
  sampleFields,
  samples,
  formValues,
  onDragStart,
  onDragOver,
  onDragEnd,
  isCellInDragSelection,
  shouldShowField,
  getDynamicOptions,
  formatDateInput,
}: UseDataGridColumnsProps): GridColDef[] => {
  // Performance measurement - remove in production
  const calculationCount = useRef(0);
  calculationCount.current += 1;
  console.log(
    'useDataGridColumns calculation count:',
    calculationCount.current
  );
  const headerStates = useMemo(() => {
    const states: Record<string, { isVisible: boolean; isRequired: boolean }> =
      {};

    sampleFields.forEach((field) => {
      let isVisible = false;
      let isRequired = field.required;

      if (field.show_condition) {
        // Check if any sample has the condition that would make this field visible
        const conditionField = field.show_condition.field;
        const conditionValue = field.show_condition.value;

        // Check if any sample has the required condition
        const hasConditionInAnySample = samples.some((sample) => {
          const sampleValue = sample[conditionField];
          return sampleValue === conditionValue;
        });

        isVisible = hasConditionInAnySample;

        // If field is conditionally required and visible, it's required
        if (field.validation.conditional_required && isVisible) {
          isRequired = true;
        }
      } else {
        // For fields without show_condition, they're always visible
        isVisible = true;
      }

      states[field.field_id] = { isVisible, isRequired };
    });

    return states;
  }, [sampleFields, samples]);

  return useMemo(
    () =>
      sampleFields.map((field) => {
        const baseColumn: GridColDef = {
          field: field.field_id,
          renderHeader: () => {
            // Use memoized header state for optimal performance
            const { isVisible, isRequired } = headerStates[field.field_id] || {
              isVisible: true,
              isRequired: false,
            };
            const headerText = isVisible
              ? field.field_name
              : `${field.field_name} (Hidden)`;

            return (
              <Box
                sx={{
                  fontWeight: isRequired ? 'bold' : 'normal',
                  color: isVisible ? 'text.primary' : 'text.disabled',
                  fontSize: '0.875rem',
                }}
              >
                {headerText}
                {isRequired && (
                  <Box
                    component="span"
                    sx={{
                      color: 'error.main',
                      fontWeight: 'bold',
                      marginLeft: '2px',
                    }}
                  >
                    *
                  </Box>
                )}
              </Box>
            );
          },
          width: Math.max(120, Math.min(200, field.field_name.length * 12)),
          editable: true,
          type: field.input_type === 'dropdown' ? 'singleSelect' : 'string',
          headerClassName: `group-${getFieldGroupName(field.field_id)}`,
          renderEditCell:
            field.input_type === 'date'
              ? (params) => (
                  <DateEditCell
                    params={params}
                    formatDateInput={formatDateInput}
                  />
                )
              : undefined,
          renderCell: (params) => (
            <CellContent
              params={params}
              field={field}
              samples={samples}
              formValues={formValues}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              isCellInDragSelection={isCellInDragSelection}
              shouldShowField={shouldShowField}
            />
          ),
        };

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
      headerStates,
      onDragStart,
      onDragOver,
      onDragEnd,
      isCellInDragSelection,
      shouldShowField,
      getDynamicOptions,
      formatDateInput,
    ]
  );
};
