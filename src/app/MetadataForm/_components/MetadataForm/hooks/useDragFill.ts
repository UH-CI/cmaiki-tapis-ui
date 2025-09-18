import { useState, useCallback, useRef } from 'react';
import { GridRowId } from '@mui/x-data-grid';
import {
  MetadataFieldDef,
  SampleData,
  shouldShowField,
} from '../metadataUtils';

interface UseDragFillProps {
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  formValues: { [key: string]: string };
  handleSampleChange: (
    rowIndex: number,
    fieldName: string,
    value: string
  ) => void;
}

interface DragFillState {
  isActive: boolean;
  sourceCell: { rowId: GridRowId; field: string; value: string } | null;
  targetCells: { rowId: GridRowId; field: string }[];
}

export const useDragFill = ({
  sampleFields,
  samples,
  formValues,
  handleSampleChange,
}: UseDragFillProps) => {
  const [dragFillState, setDragFillState] = useState<DragFillState>({
    isActive: false,
    sourceCell: null,
    targetCells: [],
  });

  const dragStartRef = useRef<{ rowId: GridRowId; field: string } | null>(null);

  const startDragFill = useCallback(
    (rowId: GridRowId, field: string, value: string) => {
      setDragFillState({
        isActive: true,
        sourceCell: { rowId, field, value },
        targetCells: [],
      });
      dragStartRef.current = { rowId, field };
    },
    []
  );

  const updateDragFill = useCallback(
    (rowId: GridRowId, field: string) => {
      if (!dragFillState.isActive || !dragFillState.sourceCell) return;

      // Only allow drag fill within the same column
      if (field !== dragFillState.sourceCell.field) return;

      const sourceRowIndex = Number(dragFillState.sourceCell.rowId);
      const targetRowIndex = Number(rowId);

      // Determine the range of cells to fill
      const startRow = Math.min(sourceRowIndex, targetRowIndex);
      const endRow = Math.max(sourceRowIndex, targetRowIndex);

      const targetCells: { rowId: GridRowId; field: string }[] = [];

      for (let i = startRow; i <= endRow; i++) {
        if (i !== sourceRowIndex) {
          // Check if this cell should be fillable (respects conditional visibility)
          const rowData = samples[i - 1] || {};
          const combinedValues = { ...formValues, ...rowData };
          const fieldDef = sampleFields.find((f) => f.field_id === field);

          if (fieldDef && shouldShowField(fieldDef, combinedValues)) {
            targetCells.push({ rowId: i, field });
          }
        }
      }

      setDragFillState((prev) => ({
        ...prev,
        targetCells,
      }));
    },
    [
      dragFillState.isActive,
      dragFillState.sourceCell,
      samples,
      formValues,
      sampleFields,
    ]
  );

  const completeDragFill = useCallback(() => {
    if (!dragFillState.isActive || !dragFillState.sourceCell) return;

    // Apply the source value to all target cells
    dragFillState.targetCells.forEach(({ rowId, field }) => {
      const rowIndex = Number(rowId) - 1;
      handleSampleChange(rowIndex, field, dragFillState.sourceCell!.value);
    });

    // Reset drag fill state
    setDragFillState({
      isActive: false,
      sourceCell: null,
      targetCells: [],
    });
    dragStartRef.current = null;
  }, [dragFillState, handleSampleChange]);

  const cancelDragFill = useCallback(() => {
    setDragFillState({
      isActive: false,
      sourceCell: null,
      targetCells: [],
    });
    dragStartRef.current = null;
  }, []);

  const isCellInDragSelection = useCallback(
    (rowId: GridRowId, field: string) => {
      if (!dragFillState.isActive) return false;

      const isSource =
        dragFillState.sourceCell?.rowId === rowId &&
        dragFillState.sourceCell?.field === field;
      const isTarget = dragFillState.targetCells.some(
        (cell) => cell.rowId === rowId && cell.field === field
      );

      return isSource || isTarget;
    },
    [dragFillState]
  );

  return {
    dragFillState,
    startDragFill,
    updateDragFill,
    completeDragFill,
    cancelDragFill,
    isCellInDragSelection,
  };
};
