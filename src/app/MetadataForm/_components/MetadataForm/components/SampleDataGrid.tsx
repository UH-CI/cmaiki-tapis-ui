import React, { useRef, useEffect, useState } from 'react';
import { DataGrid, GridRowSelectionModel, GridColDef } from '@mui/x-data-grid';
import { Box, Button, ButtonGroup } from '@mui/material';
import { MetadataFieldDef, SampleData } from '../metadataUtils';
import { MUIAutocompleteDropdown } from './MuiDropdown';
import { useDataGridColumns } from '../hooks/useDataGridColumns';
import { useDragFill } from '../hooks/useDragFill';
import XLSXUpload from './XLSXUpload';
import styles from '../MetadataForm.module.scss';

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
  handleBulkImport: (data: SampleData[]) => void;
  handleProjectMetadataImport?: (metadata: { [key: string]: string }) => void;
  handleAddMoreRows: () => void;
  shouldShowField: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => boolean;
  getDynamicOptions: (
    field: MetadataFieldDef,
    formValues: { [key: string]: string }
  ) => string[];
  formatDateInput: (value: string) => string;
  sampleIds?: string[];
  validationErrors?: Record<string, string[]>;
}

export const SampleDataGrid: React.FC<SampleDataGridProps> = React.memo(
  ({
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
    handleBulkImport,
    handleProjectMetadataImport,
    handleAddMoreRows,
    shouldShowField,
    getDynamicOptions,
    formatDateInput,
    sampleIds = [],
    validationErrors = {},
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
      validationErrors,
    });

    // Create sample_id column (read-only, first column)
    const sampleIdColumn: GridColDef = {
      field: 'sample_id',
      headerName: 'Sample ID',
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const rowIndex = Number(params.id) - 1;
        const sampleId = sampleIds[rowIndex] || '';
        return (
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: sampleId ? '#000' : '#999',
              fontStyle: sampleId ? 'normal' : 'italic',
              width: '100%',
              padding: '0 8px',
            }}
          >
            {sampleId || 'Not generated'}
          </Box>
        );
      },
      cellClassName: 'sample-id-cell',
    };

    // Prepend sample_id column to the beginning
    const allColumns = [sampleIdColumn, ...columns];

    const enhancedColumns = allColumns.map((col) => {
      // Skip enhancement for sample_id column
      if (col.field === 'sample_id') {
        return col;
      }

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

        // Skip sample_id column (index 0) during navigation
        if (nextColIndex === 0) {
          nextColIndex = shiftKey ? enhancedColumns.length - 1 : 1;
          if (shiftKey) nextRowIndex--;
        }

        if (nextColIndex < 0) {
          nextColIndex = enhancedColumns.length - 1;
          nextRowIndex--;
        } else if (nextColIndex >= enhancedColumns.length) {
          nextColIndex = 1; // Skip sample_id column
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

      // Skip sample_id column - it's not editable
      if (nextField === 'sample_id') {
        return;
      }

      const fieldDef = sampleFields.find((f) => f.field_id === nextField);

      // Check field visibility
      const rowData = samples[nextRowIndex] || {};
      const combinedValues = { ...formValues, ...rowData };
      const isFieldVisible = fieldDef
        ? shouldShowField(fieldDef, formValues)
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
      <div className={styles['sample-datagrid-main-container']}>
        <div className={`mb-3 ${styles['sample-datagrid-controls']}`}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
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
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearRows}
              >
                Clear Selected
              </Button>
            </ButtonGroup>

            {copiedRowData && (
              <span className="badge badge-info">Row data copied</span>
            )}

            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddMoreRows}
              size="small"
            >
              Add Rows
            </Button>

            <XLSXUpload
              sampleFields={sampleFields}
              onDataImport={handleBulkImport}
              onProjectMetadataImport={handleProjectMetadataImport}
            />
          </Box>
        </div>

        <Box
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 400,
          }}
        >
          <DataGrid
            rows={rows}
            columns={enhancedColumns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 100 },
              },
            }}
            pageSizeOptions={[100]}
            hideFooterSelectedRowCount
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={setSelectedRows}
            isCellEditable={(params) => params.field !== 'sample_id'}
            scrollbarSize={17}
            disableVirtualization={false}
            autoHeight={false}
            onCellClick={(params) => {
              // Don't allow editing sample_id column
              if (params.field === 'sample_id') {
                return;
              }

              const rowData = samples[Number(params.id) - 1] || {};
              const combinedValues = { ...formValues, ...rowData };
              const field = sampleFields.find(
                (f) => f.field_id === params.field
              );

              // Always allow editing for sample fields (visibility is handled by CellContent)
              if (field) {
                const cellMode = params.api.getCellMode(
                  params.id,
                  params.field
                );
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
                // Skip sample_id field - it's auto-generated
                if (
                  fieldName !== 'id' &&
                  fieldName !== 'sample_id' &&
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

              // Don't navigate from sample_id column
              if (params.field === 'sample_id') {
                event.preventDefault();
                event.stopPropagation();
                return;
              }

              const field = sampleFields.find(
                (f) => f.field_id === params.field
              );
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

              // Check if row has validation errors
              const rowIndex = (params.id as number) - 1;
              const hasErrors = Object.keys(validationErrors).some(
                (errorKey) => {
                  const match = errorKey.match(/samples\[(\d+)\]/);
                  return match && parseInt(match[1]) === rowIndex;
                }
              );

              if (hasErrors) {
                return 'row-with-errors';
              }
              return hasData ? 'row-with-data' : '';
            }}
            sx={{
              height: '100%',
              width: '100%',
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
                '&.row-with-errors': {
                  backgroundColor: 'rgba(220, 53, 69, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(220, 53, 69, 0.12)',
                  },
                },
              },
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
                border: '1px solid #e0e0e0',
                cursor: 'text',
                '&.sample-id-cell': {
                  backgroundColor: '#f5f5f5',
                  cursor: 'default',
                  fontFamily: 'monospace',
                },
                '&.cell-with-error': {
                  backgroundColor: 'rgba(220, 53, 69, 0.15)',
                  borderColor: '#dc3545',
                  borderWidth: '2px',
                  '&:hover': {
                    backgroundColor: 'rgba(220, 53, 69, 0.25)',
                  },
                },
              },
            }}
          />
        </Box>
      </div>
    );
  }
);
