import React, { useMemo, useCallback } from 'react';
import { GridColDef, GridRowId } from '@mui/x-data-grid';
import { Box, Typography, TextField, Tooltip } from '@mui/material';
import { MetadataFieldDef, SampleData } from '../metadataUtils';
import { DragFillHandle } from '../components/DragFillHandle';

// Helper function to format tooltip content
const formatTooltipContent = (field: MetadataFieldDef): React.ReactNode => {
  const content = [];

  // Add description
  if (field.definition) {
    content.push(
      <Typography
        key="description"
        variant="body2"
        sx={{ fontWeight: 'bold', mb: 0.5 }}
      >
        Description:
      </Typography>
    );
    content.push(
      <Typography key="description-text" variant="body2" sx={{ mb: 1 }}>
        {field.definition}
      </Typography>
    );
  }

  // Add example
  if (field.example) {
    content.push(
      <Typography
        key="example"
        variant="body2"
        sx={{ fontWeight: 'bold', mb: 0.5 }}
      >
        Example:
      </Typography>
    );
    content.push(
      <Typography
        key="example-text"
        variant="body2"
        sx={{ mb: 1, fontFamily: 'monospace' }}
      >
        {field.example}
      </Typography>
    );
  }

  // Add validation description
  if (field.validation_description) {
    content.push(
      <Typography
        key="validation"
        variant="body2"
        sx={{ fontWeight: 'bold', mb: 0.5 }}
      >
        Validation Rules:
      </Typography>
    );
    content.push(
      <Typography key="validation-text" variant="body2">
        {field.validation_description}
      </Typography>
    );
  }

  return content.length > 0 ? (
    <Box sx={{ maxWidth: 300 }}>{content}</Box>
  ) : null;
};

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
  validationErrors?: Record<string, string[]>;
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
  fieldVisibilityCache?: Record<string, boolean>;
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
  fieldVisibilityCache,
}) => {
  const rowData = samples[Number(params.id) - 1] || {};
  const combinedValues = { ...formValues, ...rowData };

  // Use cached visibility for sample fields
  const isVisible = fieldVisibilityCache?.[field.field_id] ?? true;

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
  validationErrors = {},
}: UseDataGridColumnsProps): GridColDef[] => {
  // Memoize header states based only on sample data, not form values
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
        // Only required if conditional_required is explicitly true
        if (field.validation.conditional_required === true && isVisible) {
          isRequired = true;
        }
      } else if (isVisible) {
        isRequired = field.required;
      } else {
        // For fields without show_condition, they're always visible
        isVisible = true;
      }

      states[field.field_id] = { isVisible, isRequired };
    });

    return states;
  }, [sampleFields, samples]);

  // Memoize field visibility for each field based on sample data
  const fieldVisibilityCache = useMemo(() => {
    const cache: Record<string, boolean> = {};
    sampleFields.forEach((field) => {
      let isVisible = true; // Default to visible

      // For sample fields with show_condition, check if any sample has the condition
      if (field.show_condition) {
        const conditionField = field.show_condition.field;
        const conditionValue = field.show_condition.value;

        // Check if any sample has the required condition
        const hasConditionInAnySample = samples.some((sample) => {
          return sample[conditionField] === conditionValue;
        });

        isVisible = hasConditionInAnySample;
      }

      cache[field.field_id] = isVisible;
    });
    return cache;
  }, [sampleFields, samples]);

  // Memoize dynamic options for each field based on form values
  const fieldOptionsCache = useMemo(() => {
    const cache: Record<string, string[]> = {};
    sampleFields.forEach((field) => {
      if (field.input_type === 'dropdown') {
        cache[field.field_id] = getDynamicOptions(field, formValues);
      }
    });
    return cache;
  }, [sampleFields, formValues, getDynamicOptions]);

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

            const tooltipContent = formatTooltipContent(field);

            return (
              <Tooltip
                title={tooltipContent || ''}
                arrow
                placement="top"
                enterDelay={500}
                leaveDelay={200}
                disableHoverListener={!tooltipContent}
              >
                <Box
                  sx={{
                    fontWeight: isRequired ? 'bold' : 'normal',
                    color: isVisible ? 'text.primary' : 'text.disabled',
                    fontSize: '0.875rem',
                    cursor: tooltipContent ? 'help' : 'default',
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
              </Tooltip>
            );
          },
          width: Math.max(180, Math.min(350, field.field_name.length * 14)),
          editable: true,
          type: field.input_type === 'dropdown' ? 'singleSelect' : 'string',
          headerClassName: `group-${getFieldGroupName(field.field_id)}`,
          cellClassName: (params) => {
            const rowIndex = Number(params.id) - 1;
            const errorKey = `samples[${rowIndex}].${field.field_id}`;
            const hasError = validationErrors[errorKey]?.length > 0;
            return hasError ? 'cell-with-error' : '';
          },
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
              fieldVisibilityCache={fieldVisibilityCache}
            />
          ),
        };

        if (field.input_type === 'dropdown') {
          return {
            ...baseColumn,
            valueOptions: (params: any) => {
              const rowData = samples[Number(params.id) - 1] || {};
              const combinedValues = { ...formValues, ...rowData };

              // Use cached visibility check for better performance
              const isVisible = fieldVisibilityCache[field.field_id] ?? true;

              if (!isVisible) return [];

              // Use cached options for better performance
              return (
                fieldOptionsCache[field.field_id] ||
                getDynamicOptions(field, formValues)
              );
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
      fieldVisibilityCache,
      fieldOptionsCache,
      onDragStart,
      onDragOver,
      onDragEnd,
      isCellInDragSelection,
      shouldShowField,
      getDynamicOptions,
      formatDateInput,
      validationErrors,
    ]
  );
};
