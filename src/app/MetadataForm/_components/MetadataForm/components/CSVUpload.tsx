import React, { useRef, useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Popover,
} from '@mui/material';
import { CloudUpload, Close, Info } from '@mui/icons-material';
import { MetadataFieldDef, SampleData } from '../metadataUtils';

interface CSVUploadProps {
  sampleFields: MetadataFieldDef[];
  onDataImport: (data: SampleData[]) => void;
  disabled?: boolean;
}

interface ParsedCSVData {
  success: boolean;
  data?: SampleData[];
  errors?: string[];
  warnings?: string[];
  matchedColumns?: string[];
  unmatchedColumns?: string[];
}

const CSVUpload: React.FC<CSVUploadProps> = ({
  sampleFields,
  onDataImport,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tooltipAnchorRef = useRef<HTMLButtonElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<ParsedCSVData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Simplified CSV parser using a more straightforward approach
  const parseCSV = (csvText: string): ParsedCSVData => {
    const lines = csvText.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        errors: [
          'CSV file must contain at least a header row and one data row',
        ],
      };
    }

    // Simple CSV parsing - handles basic quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && (i === 0 || line[i - 1] === ',')) {
          inQuotes = true;
        } else if (
          char === '"' &&
          inQuotes &&
          (i === line.length - 1 || line[i + 1] === ',')
        ) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
          continue;
        } else {
          current += char;
        }
      }

      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const fieldIds = sampleFields.map((field) => field.field_id);

    const matchedColumns = headers.filter((header) =>
      fieldIds.includes(header)
    );
    const unmatchedColumns = headers.filter(
      (header) => !fieldIds.includes(header)
    );

    if (matchedColumns.length === 0) {
      return {
        success: false,
        errors: [
          'No matching columns found in your CSV file.',
          'Please ensure your CSV headers match the expected field IDs exactly.',
          'Click the info icon (ℹ️) next to the Upload CSV button to see the expected column names.',
        ],
        unmatchedColumns,
      };
    }

    // Parse data rows with simplified error handling
    const data: SampleData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const rowData: SampleData = {};
      matchedColumns.forEach((fieldId) => {
        const index = headers.indexOf(fieldId);
        if (index !== -1) {
          rowData[fieldId] = values[index] || '';
        }
      });

      data.push(rowData);
    }

    const warnings =
      unmatchedColumns.length > 0
        ? [
            `Found ${
              unmatchedColumns.length
            } unmatched columns: ${unmatchedColumns.join(', ')}`,
          ]
        : undefined;

    return {
      success: true,
      data,
      matchedColumns,
      unmatchedColumns,
      warnings,
      errors: errors.length > 0 ? errors : undefined,
    };
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadResult({ success: false, errors: ['Please select a CSV file'] });
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setUploadResult(null);

    try {
      const text = await file.text();
      const result = parseCSV(text);
      setUploadResult(result);

      // Show result dialog for both success and error cases
      setShowResultDialog(true);
    } catch (error) {
      setUploadResult({
        success: false,
        errors: ['Error reading file: ' + (error as Error).message],
      });
      setShowResultDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setUploadResult(null);
    setFileName('');
    setShowResultDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (uploadResult?.success && uploadResult.data) {
      onDataImport(uploadResult.data);
      setShowResultDialog(false);
      // Auto-clear after successful import
      setTimeout(handleClear, 1000);
    }
  };

  const handleTooltipToggle = () => {
    setShowTooltip(!showTooltip);
  };

  const expectedFields = sampleFields.map((field) => field.field_id).join(', ');

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          variant="outlined"
          startIcon={
            isProcessing ? <CircularProgress size={20} /> : <CloudUpload />
          }
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          size="small"
        >
          {isProcessing ? 'Processing...' : 'Upload CSV'}
        </Button>

        <IconButton
          ref={tooltipAnchorRef}
          size="small"
          color="primary"
          onClick={handleTooltipToggle}
        >
          <Info fontSize="small" />
        </IconButton>

        <Popover
          open={showTooltip}
          anchorEl={tooltipAnchorRef.current}
          onClose={() => setShowTooltip(false)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, maxWidth: 400 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Expected column headers:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
              {expectedFields}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Note:
            </Typography>
            <Typography variant="body2">
              CSV will be imported starting from the first empty row. Only
              columns matching field IDs will be imported.
            </Typography>
          </Box>
        </Popover>
      </Box>

      {fileName && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
          <Tooltip title="Clear">
            <IconButton size="small" onClick={handleClear}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Result Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {uploadResult?.success ? 'CSV Import Ready' : 'CSV Import Error'}
        </DialogTitle>
        <DialogContent>
          {uploadResult && (
            <Box>
              {uploadResult.success ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    CSV parsed successfully!
                  </Typography>
                  <Typography variant="body2">
                    {uploadResult.data?.length || 0} rows ready for import
                  </Typography>
                  {uploadResult.matchedColumns && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Matched columns:</strong>{' '}
                      {uploadResult.matchedColumns.join(', ')}
                    </Typography>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    CSV Import Failed
                  </Typography>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <Box>
                      {uploadResult.errors.map((error, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{ mb: 0.5 }}
                        >
                          • {error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}

              {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    Warnings:
                  </Typography>
                  {uploadResult.warnings.map((warning, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      • {warning}
                    </Typography>
                  ))}
                </Alert>
              )}

              {!uploadResult.success &&
                uploadResult.unmatchedColumns &&
                uploadResult.unmatchedColumns.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      Columns found in your CSV:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {uploadResult.unmatchedColumns.join(', ')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      None of these match the expected field IDs. Please check
                      the column names and try again.
                    </Typography>
                  </Alert>
                )}

              {uploadResult.success && uploadResult.data && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    Preview (first 5 rows):
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {uploadResult.matchedColumns?.map((column) => (
                            <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                              {column}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadResult.data.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {uploadResult.matchedColumns?.map((column) => (
                              <TableCell key={column}>
                                {row[column] || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>
            {uploadResult?.success ? 'Cancel' : 'Close'}
          </Button>
          {uploadResult?.success && uploadResult.data && (
            <Button onClick={handleImport} variant="contained" color="primary">
              Import Data
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CSVUpload;
