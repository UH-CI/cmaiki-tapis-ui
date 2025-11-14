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
import { parseXLSX } from '../xlsxUtils';

interface XLSXUploadProps {
  sampleFields: MetadataFieldDef[];
  onDataImport: (data: SampleData[]) => void;
  onProjectMetadataImport?: (metadata: { [key: string]: string }) => void;
  disabled?: boolean;
}

interface ParsedXLSXData {
  success: boolean;
  projectMetadata?: { [key: string]: string };
  sampleData?: SampleData[];
  errors?: string[];
  warnings?: string[];
  matchedColumns?: string[];
  unmatchedColumns?: string[];
}

const XLSXUpload: React.FC<XLSXUploadProps> = ({
  sampleFields,
  onDataImport,
  onProjectMetadataImport,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tooltipAnchorRef = useRef<HTMLButtonElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<ParsedXLSXData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.toLowerCase();
    if (!fileExtension.endsWith('.xlsx') && !fileExtension.endsWith('.xls')) {
      setUploadResult({
        success: false,
        errors: ['Please select an Excel file (.xlsx or .xls)'],
      });
      setShowResultDialog(true);
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setUploadResult(null);

    try {
      const result = await parseXLSX(file, sampleFields);
      setUploadResult(result);
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
    if (uploadResult?.success && uploadResult.sampleData) {
      // Import sample data
      onDataImport(uploadResult.sampleData);

      // Import project metadata if handler provided
      if (onProjectMetadataImport && uploadResult.projectMetadata) {
        onProjectMetadataImport(uploadResult.projectMetadata);
      }

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
          {isProcessing ? 'Processing...' : 'Upload XLSX'}
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
          <Box sx={{ p: 2, maxWidth: 500 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              XLSX Template Format:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The XLSX file should follow the C-MAIKI template structure:
            </Typography>
            <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
              <li>
                <Typography variant="body2">
                  Rows 1-9: Project metadata (contact info, descriptions)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Row 10: Column headers (field IDs)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">Row 11+: Sample data</Typography>
              </li>
            </ul>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Expected sample columns (Row 10):
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 2, wordBreak: 'break-all', fontSize: '0.75rem' }}
            >
              {expectedFields}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Note: Both project metadata and sample data will be imported.
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
        accept=".xlsx,.xls"
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
          {uploadResult?.success ? 'XLSX Import Ready' : 'XLSX Import Error'}
        </DialogTitle>
        <DialogContent>
          {uploadResult && (
            <Box>
              {uploadResult.success ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      XLSX parsed successfully!
                    </Typography>
                    <Typography variant="body2">
                      {uploadResult.sampleData?.length || 0} sample rows ready
                      for import
                    </Typography>
                    {uploadResult.projectMetadata &&
                      Object.keys(uploadResult.projectMetadata).length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Project metadata fields found:</strong>{' '}
                          {Object.keys(uploadResult.projectMetadata).length}
                        </Typography>
                      )}
                    {uploadResult.matchedColumns && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Matched sample columns:</strong>{' '}
                        {uploadResult.matchedColumns.join(', ')}
                      </Typography>
                    )}
                  </Alert>

                  {uploadResult.projectMetadata &&
                    Object.keys(uploadResult.projectMetadata).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          Project Metadata Preview:
                        </Typography>
                        <TableContainer
                          component={Paper}
                          sx={{ maxHeight: 150, mb: 2 }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Field
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Value
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(uploadResult.projectMetadata)
                                .slice(0, 5)
                                .map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>{value}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                  {uploadResult.sampleData &&
                    uploadResult.sampleData.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          Sample Data Preview (first 5 rows):
                        </Typography>
                        <TableContainer
                          component={Paper}
                          sx={{ maxHeight: 250 }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {uploadResult.matchedColumns?.map((column) => (
                                  <TableCell
                                    key={column}
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    {column}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {uploadResult.sampleData
                                .slice(0, 5)
                                .map((row, index) => (
                                  <TableRow key={index}>
                                    {uploadResult.matchedColumns?.map(
                                      (column) => (
                                        <TableCell key={column}>
                                          {row[column] || ''}
                                        </TableCell>
                                      )
                                    )}
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                </>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    XLSX Import Failed
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
                      Columns found in your XLSX (Row 10):
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {uploadResult.unmatchedColumns.join(', ')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      None of these match the expected field IDs. Please check
                      the column names in Row 10 and try again.
                    </Typography>
                  </Alert>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>
            {uploadResult?.success ? 'Cancel' : 'Close'}
          </Button>
          {uploadResult?.success && uploadResult.sampleData && (
            <Button onClick={handleImport} variant="contained" color="primary">
              Import Data
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default XLSXUpload;
