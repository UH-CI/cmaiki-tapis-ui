import React from 'react';
import { DataGrid, GridRowSelectionModel } from '@mui/x-data-grid';
import { Box, Button, ButtonGroup } from '@mui/material';
import { MetadataFieldDef, SampleData } from '../metadataUtils';
import { MUIAutocompleteDropdown } from './MuiDropdown';
import { useDataGridColumns } from '../hooks/useDataGridColumns';
import { useDragFill } from '../hooks/useDragFill';

interface SampleDataGridProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  formValues: { [key: string]: string };
  rows: any[];
  selectedRows: GridRowSelectionModel;
  setSelectedRows: (rows: GridRowSelectionModel) => void;
  copiedRowData: SampleData | null;
  handleSampleChange: (
    rowIndex: number,
    fieldName: string,
    value: string
  ) => void;
  handleCopyRow: () => void;
  handlePasteToRows: () => void;
  handleClearRows: () => void;
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

export const SampleDataGrid: React.FC<SampleDataGridProps> = ({
  sampleFields,
  samples,
  formValues,
  rows,
  selectedRows,
  setSelectedRows,
  copiedRowData,
  handleSampleChange,
  handleCopyRow,
  handlePasteToRows,
  handleClearRows,
  shouldShowField,
  getDynamicOptions,
  formatDateInput,
}) => {
  const {
    startDragFill,
    updateDragFill,
    completeDragFill,
    isCellInDragSelection,
  } = useDragFill({
    sampleFields,
    samples,
    formValues,
    handleSampleChange,
    shouldShowField,
  });

  const columns = useDataGridColumns({
    sampleFields,
    samples,
    formValues,
    onDragStart: startDragFill,
    onDragOver: updateDragFill,
    onDragEnd: completeDragFill,
    isCellInDragSelection,
    shouldShowField,
    getDynamicOptions,
    formatDateInput,
  });

  const enhancedColumns = columns.map((col) => {
    const field = sampleFields.find((f) => f.field_id === col.field);

    if (field?.input_type !== 'dropdown') return col;

    return {
      ...col,
      renderEditCell: (params: any) => {
        const rowData = samples[Number(params.id) - 1] || {};
        const combinedValues = { ...formValues, ...rowData };
        const options = getDynamicOptions(field, combinedValues);

        return (
          <MUIAutocompleteDropdown
            value={params.value}
            options={options}
            onChange={(newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue,
              });
            }}
            onSelectionMade={() => {
              params.api.stopCellEditMode({
                id: params.id,
                field: params.field,
              });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab' || e.key === 'Enter') {
                e.stopPropagation();
                params.api.stopCellEditMode({
                  id: params.id,
                  field: params.field,
                });
              }
            }}
            placeholder="Type to search..."
          />
        );
      },
    };
  });

  const navigateToNextCell = (params: any, event: any) => {
    const { key, shiftKey } = event;
    let nextRowIndex = Number(params.id) - 1;
    let nextColIndex = enhancedColumns.findIndex(
      (col) => col.field === params.field
    );

    if (key === 'Tab') {
      nextColIndex += shiftKey ? -1 : 1;
      if (nextColIndex < 0) {
        nextColIndex = enhancedColumns.length - 1;
        nextRowIndex--;
      } else if (nextColIndex >= enhancedColumns.length) {
        nextColIndex = 0;
        nextRowIndex++;
      }
    } else if (key === 'Enter') {
      nextRowIndex += shiftKey ? -1 : 1;
    }

    // Handle row wrapping
    if (nextRowIndex < 0) nextRowIndex = rows.length - 1;
    if (nextRowIndex >= rows.length) nextRowIndex = 0;

    const nextRowId = nextRowIndex + 1;
    const nextField = enhancedColumns[nextColIndex].field;
    const fieldDef = sampleFields.find((f) => f.field_id === nextField);

    // Check field visibility
    const rowData = samples[nextRowIndex] || {};
    const combinedValues = { ...formValues, ...rowData };
    const isFieldVisible = fieldDef
      ? shouldShowField(fieldDef, combinedValues)
      : true;

    setTimeout(() => {
      params.api.setCellFocus(nextRowId, nextField);

      if (isFieldVisible) {
        params.api.startCellEditMode({
          id: nextRowId,
          field: nextField,
          deleteValue: false,
        });

        // Focus input element
        setTimeout(() => {
          const editingCell = document.querySelector(
            '.MuiDataGrid-cell--editing'
          );
          const inputElement = editingCell?.querySelector(
            'input'
          ) as HTMLInputElement;
          if (inputElement) {
            inputElement.focus();
            if (fieldDef?.input_type !== 'dropdown') {
              const length = inputElement.value.length;
              inputElement.setSelectionRange(length, length);
            }
          }
        }, 100);
      }
    }, 0);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div className="mb-3" style={{ flexShrink: 0 }}>
        <ButtonGroup size="small" disabled={selectedRows.length === 0}>
          <Button
            variant="outlined"
            onClick={handleCopyRow}
            disabled={selectedRows.length !== 1}
          >
            Copy Row
          </Button>
          <Button
            variant="outlined"
            onClick={handlePasteToRows}
            disabled={!copiedRowData || selectedRows.length === 0}
          >
            Paste to Selected
          </Button>
          <Button variant="outlined" color="error" onClick={handleClearRows}>
            Clear Selected
          </Button>
        </ButtonGroup>
        {copiedRowData && (
          <span className="badge badge-info ms-2">Row data copied</span>
        )}
      </div>

      <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
        <DataGrid
          rows={rows}
          columns={enhancedColumns}
          hideFooterPagination
          hideFooterSelectedRowCount
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={setSelectedRows}
          isCellEditable={() => true}
          scrollbarSize={17}
          disableVirtualization={false}
          onCellClick={(params) => {
            const rowData = samples[Number(params.id) - 1] || {};
            const combinedValues = { ...formValues, ...rowData };
            const field = sampleFields.find((f) => f.field_id === params.field);

            if (field && shouldShowField(field, combinedValues)) {
              const cellMode = params.api.getCellMode(params.id, params.field);
              if (cellMode === 'view') {
                params.api.startCellEditMode({
                  id: params.id,
                  field: params.field,
                });
              }
            }
          }}
          processRowUpdate={(newRow, oldRow) => {
            if (!newRow?.id) return oldRow || {};

            const rowIndex = Number(newRow.id) - 1;
            Object.keys(newRow).forEach((fieldName) => {
              if (
                fieldName !== 'id' &&
                newRow[fieldName] !== oldRow?.[fieldName]
              ) {
                handleSampleChange(
                  rowIndex,
                  fieldName,
                  newRow[fieldName] || ''
                );
              }
            });
            return newRow;
          }}
          onProcessRowUpdateError={(error) => {
            console.error('DataGrid row update error:', error);
          }}
          onCellKeyDown={(params, event) => {
            const { key } = event;
            if (key !== 'Tab' && key !== 'Enter') return;

            const field = sampleFields.find((f) => f.field_id === params.field);
            const isDropdownField = field?.input_type === 'dropdown';
            const cellMode = params.api.getCellMode(params.id, params.field);
            const isEditing = cellMode === 'edit';

            // Let dropdown handle Enter when editing
            if (isDropdownField && isEditing && key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            navigateToNextCell(params, event);
          }}
          getRowClassName={(params) => {
            const sample = samples[(params.id as number) - 1];
            const hasData =
              sample && Object.values(sample).some((value) => value?.trim());
            return hasData ? 'row-with-data' : '';
          }}
          sx={{
            '& .MuiDataGrid-columnHeader': {
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#e9ecef',
              border: '1px solid #adb5bd',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f7fa',
            },
            '& .MuiDataGrid-row': {
              '&.row-with-data': {
                backgroundColor: 'rgba(40, 167, 69, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(40, 167, 69, 0.08)',
                },
              },
            },
            '& .MuiDataGrid-footerContainer': {
              display: 'none',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
              border: '1px solid #e0e0e0',
              cursor: 'text',
            },
          }}
        />
      </Box>
    </div>
  );
};
