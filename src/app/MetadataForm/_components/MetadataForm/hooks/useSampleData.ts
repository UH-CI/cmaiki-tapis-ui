import { useState, useCallback, useMemo, useRef } from 'react';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import {
  MetadataFieldDef,
  SampleData,
  createEmptySample,
} from '../metadataUtils';

interface UseSampleDataProps {
  sampleFields: MetadataFieldDef[];
  initialRows?: number;
}

export const useSampleData = ({
  sampleFields,
  initialRows = 100,
}: UseSampleDataProps) => {
  // Performance measurement - remove in production
  const hookCallCount = useRef(0);
  hookCallCount.current += 1;
  console.log('useSampleData hook call count:', hookCallCount.current);
  const [samples, setSamples] = useState<SampleData[]>(() =>
    Array.from({ length: initialRows }, () => createEmptySample(sampleFields))
  );
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [copiedRowData, setCopiedRowData] = useState<SampleData | null>(null);

  const handleSampleChange = useCallback(
    (rowIndex: number, fieldName: string, value: string) => {
      setSamples((prev) => {
        const newSamples = [...prev];
        newSamples[rowIndex] = { ...newSamples[rowIndex], [fieldName]: value };
        return newSamples;
      });
    },
    []
  );

  const handleCopyRow = useCallback(() => {
    if (selectedRows.length === 1) {
      const rowIndex = Number(selectedRows[0]) - 1;
      setCopiedRowData({ ...samples[rowIndex] });
    }
  }, [selectedRows, samples]);

  const handlePasteToRows = useCallback(() => {
    if (copiedRowData && selectedRows.length > 0) {
      selectedRows.forEach((id) => {
        const rowIndex = Number(id) - 1;
        Object.entries(copiedRowData).forEach(([fieldName, value]) => {
          if (value?.trim()) {
            handleSampleChange(rowIndex, fieldName, value);
          }
        });
      });
      setSelectedRows([]);
    }
  }, [copiedRowData, selectedRows, handleSampleChange]);

  const handleClearRows = useCallback(() => {
    selectedRows.forEach((id) => {
      const rowIndex = Number(id) - 1;
      sampleFields.forEach((field) => {
        handleSampleChange(rowIndex, field.field_id, '');
      });
    });
    setSelectedRows([]);
  }, [selectedRows, sampleFields, handleSampleChange]);

  const handleBulkImport = useCallback(
    (importData: SampleData[]) => {
      setSamples((prev) => {
        const newSamples = [...prev];

        // Import data starting from the first empty row or append to the end
        let startIndex = 0;

        // Find the first completely empty row
        for (let i = 0; i < newSamples.length; i++) {
          const isEmpty = sampleFields.every(
            (field) => !newSamples[i][field.field_id]?.trim()
          );
          if (isEmpty) {
            startIndex = i;
            break;
          }
        }

        // If no empty rows found, extend the array
        if (startIndex >= newSamples.length) {
          const additionalRows = Array.from({ length: importData.length }, () =>
            createEmptySample(sampleFields)
          );
          newSamples.push(...additionalRows);
          startIndex = newSamples.length - importData.length;
        }

        // Import the data
        importData.forEach((importRow, index) => {
          const targetIndex = startIndex + index;
          if (targetIndex < newSamples.length) {
            // Only import fields that exist in the schema
            sampleFields.forEach((field) => {
              if (importRow.hasOwnProperty(field.field_id)) {
                newSamples[targetIndex] = {
                  ...newSamples[targetIndex],
                  [field.field_id]: importRow[field.field_id] || '',
                };
              }
            });
          }
        });

        return newSamples;
      });
    },
    [sampleFields]
  );

  const samplesWithData = useMemo(
    () =>
      samples.filter((sample) =>
        Object.values(sample).some((value) => value?.trim())
      ),
    [samples]
  );

  const rows = useMemo(
    () => samples.map((sample, index) => ({ id: index + 1, ...sample })),
    [samples]
  );

  return {
    samples,
    selectedRows,
    setSelectedRows,
    copiedRowData,
    handleSampleChange,
    handleCopyRow,
    handlePasteToRows,
    handleClearRows,
    handleBulkImport,
    samplesWithData,
    filledSampleCount: samplesWithData.length,
    rows,
  };
};
