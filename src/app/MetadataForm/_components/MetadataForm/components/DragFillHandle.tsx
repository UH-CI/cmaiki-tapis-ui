import React from 'react';
import { GridRowId } from '@mui/x-data-grid';

interface DragFillHandleProps {
  rowId: GridRowId;
  field: string;
  value: string;
  onDragStart: (rowId: GridRowId, field: string, value: string) => void;
  onDragOver: (rowId: GridRowId, field: string) => void;
  onDragEnd: () => void;
  isVisible: boolean;
}

export const DragFillHandle: React.FC<DragFillHandleProps> = ({
  rowId,
  field,
  value,
  onDragStart,
  onDragOver,
  onDragEnd,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(rowId, field, value);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(rowId, field);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
      }}
      style={{
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '12px',
        height: '12px',
        cursor: 'crosshair',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
      title="Drag to fill cells"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        style={{ pointerEvents: 'none' }}
      >
        <path
          d="M2 8 L8 8 L8 2"
          stroke="#1976d2"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
