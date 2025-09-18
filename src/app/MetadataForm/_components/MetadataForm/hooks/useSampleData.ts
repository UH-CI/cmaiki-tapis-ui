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
    samplesWithData,
    filledSampleCount: samplesWithData.length,
    rows,
  };
};
