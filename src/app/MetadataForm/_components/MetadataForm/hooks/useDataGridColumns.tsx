import React, { useMemo } from 'react';
import { GridColDef, GridRowId } from '@mui/x-data-grid';
import { Box, Typography, TextField } from '@mui/material';
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

// Helper component for date input formatting
const DateEditCell: React.FC<{ params: any }> = ({ params }) => {
  if (!params || !params.row) return null;

  const formatDateInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as YYYY-MM-DD
    if (digits.length >= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(
        6,
        8
      )}`;
    } else if (digits.length >= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return digits;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

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
}> = ({
  params,
  field,
  samples,
  formValues,
  onDragStart,
  onDragOver,
  onDragEnd,
  isCellInDragSelection,
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
}: UseDataGridColumnsProps): GridColDef[] => {
  return useMemo(
    () =>
      sampleFields.map((field) => {
        const baseColumn: GridColDef = {
          field: field.field_id,
          renderHeader: () => <ColumnHeader field={field} />,
          width: Math.max(120, Math.min(200, field.field_name.length * 12)),
          editable: true,
          type: field.input_type === 'dropdown' ? 'singleSelect' : 'string',
          headerClassName: `group-${getFieldGroupName(field.field_id)}`,
          renderEditCell:
            field.input_type === 'date'
              ? (params) => <DateEditCell params={params} />
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
            />
          ),
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
