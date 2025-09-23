import { useState, useCallback, useMemo } from 'react';
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
  const [samples, setSamples] = useState<SampleData[]>(() =>
    Array.from({ length: initialRows }, () => createEmptySample(sampleFields))
  );
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [copiedRowData, setCopiedRowData] = useState<SampleData | null>(null);

  // Function to check if we need to add more rows and expand if necessary
  const ensureRowsAvailable = useCallback(
    (currentIndex: number) => {
      setSamples((prev) => {
        // If user is working within the last 50 rows, add 100 more rows
        const bufferSize = 50;
        const expansionSize = 100;

        if (currentIndex >= prev.length - bufferSize) {
          const additionalRows = Array.from({ length: expansionSize }, () =>
            createEmptySample(sampleFields)
          );
          return [...prev, ...additionalRows];
        }
        return prev;
      });
    },
    [sampleFields]
  );

  const handleSampleChange = useCallback(
    (rowIndex: number, fieldName: string, value: string) => {
      // Check if we need to expand the dataset before making changes
      ensureRowsAvailable(rowIndex);

      setSamples((prev) => {
        const newSamples = [...prev];
        newSamples[rowIndex] = { ...newSamples[rowIndex], [fieldName]: value };
        return newSamples;
      });
    },
    [ensureRowsAvailable]
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

        // Find the first completely empty row
        let startIndex = 0;
        for (let i = 0; i < newSamples.length; i++) {
          const isEmpty = sampleFields.every(
            (field) => !newSamples[i][field.field_id]?.trim()
          );
          if (isEmpty) {
            startIndex = i;
            break;
          }
        }

        // Calculate how many rows we need total (import data + buffer)
        const currentRows = newSamples.length;
        const bufferSize = 100; // Add 100 empty rows after import
        const rowsNeeded = startIndex + importData.length + bufferSize;

        // If we need more rows than we have, add them
        if (rowsNeeded > currentRows) {
          const additionalRows = Array.from(
            { length: rowsNeeded - currentRows },
            () => createEmptySample(sampleFields)
          );
          newSamples.push(...additionalRows);
        }

        // Import the data
        importData.forEach((importRow, index) => {
          const targetIndex = startIndex + index;
          // Only import fields that exist in the schema
          sampleFields.forEach((field) => {
            if (importRow.hasOwnProperty(field.field_id)) {
              newSamples[targetIndex] = {
                ...newSamples[targetIndex],
                [field.field_id]: importRow[field.field_id] || '',
              };
            }
          });
        });

        return newSamples;
      });
    },
    [sampleFields]
  );

  const handleAddMoreRows = useCallback(() => {
    setSamples((prev) => {
      const additionalRows = Array.from({ length: 100 }, () =>
        createEmptySample(sampleFields)
      );
      return [...prev, ...additionalRows];
    });
  }, [sampleFields]);

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
    handleAddMoreRows,
    samplesWithData,
    filledSampleCount: samplesWithData.length,
    rows,
  };
};
