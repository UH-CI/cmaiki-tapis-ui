import * as XLSX from 'xlsx';
import {
  MetadataFieldDef,
  SampleData,
  MultiSampleMetadata,
} from './metadataUtils';

// Parse XLSX file, expects C-MAIKI template
export const parseXLSX = (
  file: File,
  sampleFields: MetadataFieldDef[]
): Promise<{
  success: boolean;
  projectMetadata?: { [key: string]: string };
  sampleData?: SampleData[];
  errors?: string[];
  warnings?: string[];
  matchedColumns?: string[];
  unmatchedColumns?: string[];
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Use first sheet (or look for "Sample Metadata" sheet)
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Sample Metadata')) {
          sheetName = 'Sample Metadata';
        }

        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        // Build a set of valid field names from the schema for validation
        const validFieldIds = new Set([
          'project_uuid', // Special case: not in schema but is a valid set-wide field
          ...sampleFields.map((f) => f.field_id),
        ]);

        // Extract project-level metadata from specific cells
        const projectMetadata: { [key: string]: string } = {};

        const cellMappings: { [key: string]: string } = {
          B3: 'project_name',
          E3: 'project_description',
          B4: 'project_uuid',
          B8: 'point_of_contact',
          B9: 'point_of_contact_email',
          F8: 'secondary_point_of_contact',
          F9: 'secondary_point_of_contact_email',
          J8: 'sequencing_point_of_contact',
          J9: 'sequencing_point_of_contact_email',
        };

        Object.entries(cellMappings).forEach(([cell, fieldId]) => {
          const cellValue = worksheet[cell];
          if (cellValue && cellValue.v) {
            const value = String(cellValue.v).trim();
            // Skip if value is empty or is actually a field_id from the schema
            // This prevents capturing labels or field IDs instead of actual values
            if (value && !validFieldIds.has(value)) {
              projectMetadata[fieldId] = value;
            }
          }
        });

        // Expected field IDs (include sample_id which may be in generated files)
        const expectedFieldIds = [
          'sample_id',
          ...sampleFields.map((field) => field.field_id),
        ];

        // Try to find headers in row 10 or row 11
        let headerRowIndex = -1;
        let headers: string[] = [];
        let headerColumnMap: { [header: string]: number } = {};

        // Check row 10 first (index 9)
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 9, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const header = String(cell.v).trim();
            if (expectedFieldIds.includes(header)) {
              headerRowIndex = 9;
              break;
            }
          }
        }

        // If not found in row 10, check row 11 (index 10)
        if (headerRowIndex === -1) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 10, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              const header = String(cell.v).trim();
              if (expectedFieldIds.includes(header)) {
                headerRowIndex = 10;
                break;
              }
            }
          }
        }

        if (headerRowIndex === -1) {
          resolve({
            success: false,
            errors: [
              'Could not find header row in the XLSX file.',
              'Headers should be in row 10 or row 11.',
              `Expected field IDs include: ${expectedFieldIds
                .slice(0, 5)
                .join(', ')}...`,
            ],
          });
          return;
        }

        // Extract headers from the detected row
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: headerRowIndex,
            c: col,
          });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const header = String(cell.v).trim();
            headers.push(header);
            headerColumnMap[header] = col;
          } else {
            headers.push('');
          }
        }

        // Match headers with expected sample fields
        const matchedColumns = headers.filter((header) =>
          expectedFieldIds.includes(header)
        );
        const unmatchedColumns = headers.filter(
          (header) => header && !expectedFieldIds.includes(header)
        );

        if (matchedColumns.length === 0) {
          resolve({
            success: false,
            errors: [
              'No matching columns found in the XLSX file.',
              `Found headers in row ${headerRowIndex + 1}: ${headers
                .filter((h) => h)
                .join(', ')}`,
              `Expected field IDs: ${expectedFieldIds
                .slice(0, 10)
                .join(', ')}...`,
            ],
            unmatchedColumns,
          });
          return;
        }

        // Parse data rows starting from the row after headers
        const sampleData: SampleData[] = [];
        const dataStartRow = headerRowIndex + 1;

        for (let row = dataStartRow; row <= range.e.r; row++) {
          const rowData: SampleData = {};
          let hasData = false;

          // Iterate through matched columns using the column map
          for (const header of matchedColumns) {
            const col = headerColumnMap[header];
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];

            if (cell && cell.v !== undefined && cell.v !== null) {
              let value: string;

              // Handle date cells
              if (
                cell.t === 'd' ||
                cell.w?.includes('/') ||
                cell.w?.includes('-')
              ) {
                if (cell.v instanceof Date) {
                  // Format as YYYY-MM-DD
                  const year = cell.v.getFullYear();
                  const month = String(cell.v.getMonth() + 1).padStart(2, '0');
                  const day = String(cell.v.getDate()).padStart(2, '0');
                  value = `${year}-${month}-${day}`;
                } else {
                  value = String(cell.v).trim();
                }
              } else {
                value = String(cell.v).trim();
              }

              if (value) {
                rowData[header] = value;
                hasData = true;
              }
            }
          }

          if (hasData) {
            sampleData.push(rowData);
          }
        }

        const warnings: string[] = [];
        if (unmatchedColumns.length > 0) {
          warnings.push(
            `Found ${
              unmatchedColumns.length
            } unmatched columns: ${unmatchedColumns.join(', ')}`
          );
        }

        resolve({
          success: true,
          projectMetadata,
          sampleData,
          matchedColumns,
          unmatchedColumns,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      } catch (error) {
        resolve({
          success: false,
          errors: ['Error parsing XLSX file: ' + (error as Error).message],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Error reading file'],
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Internal helper: Create worksheet data structure for C-MAIKI metadata template
 */
const createMetadataWorksheetData = (
  multiSampleData: MultiSampleMetadata,
  sampleFields: MetadataFieldDef[]
): any[][] => {
  const wsData: any[][] = [];

  // Row 1: Title
  wsData[0] = ['C-MAIKI Gateway Metadata Template'];

  // Row 2: Empty
  wsData[1] = [];

  // Row 3: User, PI, and Other info labels and values
  wsData[2] = [
    'Project Name:',
    multiSampleData.setWideFields.project_name || '',
    '',
    'Project Description:',
    multiSampleData.setWideFields.project_description || '',
  ];

  // Row 4: Project UUID
  wsData[3] = [
    'Project UUID:',
    multiSampleData.setWideFields.project_uuid || '',
  ];

  // Row 5: Empty
  wsData[4] = [];

  // Row 6: Contact section labels
  wsData[5] = [
    'Contact information for DNA processing metadata/files:',
    '',
    '',
    '',
    'Contact information for PCR/library prep metadata/files:',
    '',
    '',
    '',
    'Contact information for library QC:',
  ];

  // Row 7: Description text
  wsData[6] = [
    '(e.g. extraction date/kit/protocol, personnel, storage, plate maps)',
    '',
    '',
    '',
    '(e.g. PCR conditions, library kit/protocol/concentration, storage, plate maps)',
    '',
    '',
    '',
    '(e.g. sequencing run files/logs, Bioanalyzer results)',
  ];

  // Row 8: Contact names
  wsData[7] = [
    'Name',
    multiSampleData.setWideFields.point_of_contact || '',
    '',
    '',
    'Name',
    multiSampleData.setWideFields.secondary_point_of_contact || '',
    '',
    '',
    'Name',
    multiSampleData.setWideFields.sequencing_point_of_contact || '',
  ];

  // Row 9: Contact emails
  wsData[8] = [
    'Email',
    multiSampleData.setWideFields.point_of_contact_email || '',
    '',
    '',
    'Email',
    multiSampleData.setWideFields.secondary_point_of_contact_email || '',
    '',
    '',
    'Email',
    multiSampleData.setWideFields.sequencing_point_of_contact_email || '',
  ];

  // Row 10: Column headers (sample_id first, then field IDs)
  const headers = ['sample_id', ...sampleFields.map((field) => field.field_id)];
  wsData[9] = headers;

  // Row 11+: Sample data (with sample_id)
  multiSampleData.samples.forEach((sample) => {
    const row = [
      sample.sample_id || '',
      ...sampleFields.map((field) => sample[field.field_id] || ''),
    ];
    wsData.push(row);
  });

  return wsData;
};

/**
 * Internal helper: Apply styling and formatting to worksheet
 */
const styleWorksheet = (ws: XLSX.WorkSheet, headers: string[]): void => {
  // Set column widths for better readability
  const colWidths = headers.map((header) => {
    const baseWidth = Math.max(header.length, 15);
    return { wch: baseWidth };
  });
  ws['!cols'] = colWidths;

  // Merge cells to match formatting
  if (!ws['!merges']) ws['!merges'] = [];

  // Row 1 title merge
  ws['!merges'].push(XLSX.utils.decode_range('A1:J1'));

  // Row 3 merges
  ws['!merges'].push(XLSX.utils.decode_range('B3:C3'));
  ws['!merges'].push(XLSX.utils.decode_range('E3:J3'));

  // Row 4 merge (Project UUID)
  ws['!merges'].push(XLSX.utils.decode_range('B4:E4'));

  // Row 6 merges (labels)
  ws['!merges'].push(XLSX.utils.decode_range('A6:D6'));
  ws['!merges'].push(XLSX.utils.decode_range('E6:H6'));
  ws['!merges'].push(XLSX.utils.decode_range('I6:L6'));

  // Row 7 merges (descriptions)
  ws['!merges'].push(XLSX.utils.decode_range('A7:D7'));
  ws['!merges'].push(XLSX.utils.decode_range('E7:H7'));
  ws['!merges'].push(XLSX.utils.decode_range('I7:L7'));

  // Row 8 merges (name values)
  ws['!merges'].push(XLSX.utils.decode_range('B8:C8'));
  ws['!merges'].push(XLSX.utils.decode_range('F8:G8'));
  ws['!merges'].push(XLSX.utils.decode_range('J8:K8'));

  // Row 9 merges (email values)
  ws['!merges'].push(XLSX.utils.decode_range('B9:C9'));
  ws['!merges'].push(XLSX.utils.decode_range('F9:G9'));
  ws['!merges'].push(XLSX.utils.decode_range('J9:K9'));

  // Define styles
  const titleStyle = {
    font: { bold: true, sz: 18 },
  };

  const headerStyle = {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: 'E9ECEF' } },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  const labelStyle = {
    font: { bold: true, sz: 11 },
  };

  // Apply styles
  if (ws['A1']) ws['A1'].s = titleStyle;
  if (ws['A4']) ws['A4'].s = labelStyle;

  // Style header row (row 10)
  headers.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 9, c: idx });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = headerStyle;
  });
};

/**
 * Internal helper: Generate complete workbook for C-MAIKI metadata
 */
const generateMetadataWorkbook = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  // Create worksheet data
  const wsData = createMetadataWorksheetData(multiSampleData, sampleFields);

  // Create worksheet from array
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Get headers for styling
  const headers = ['sample_id', ...sampleFields.map((field) => field.field_id)];

  // Apply styling
  styleWorksheet(ws, headers);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sample Metadata');

  return wb;
};

/**
 * Generate XLSX file as a Blob (for uploads)
 */
export const generateMetadataXLSXBlob = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): { blob: Blob; filename: string } => {
  const wb = generateMetadataWorkbook(multiSampleData, setFields, sampleFields);

  // Write to buffer with styling support
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  });

  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = `${
    multiSampleData.setWideFields.project_name || 'project'
  }_metadata.xlsx`;

  return { blob, filename };
};

/**
 * Generate and download XLSX file matching the C-MAIKI template format
 */
export const downloadMetadataXLSX = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  filename?: string
) => {
  const xlsxFilename =
    filename || `${multiSampleData.setWideFields.project_name}_metadata.xlsx`;

  const wb = generateMetadataWorkbook(multiSampleData, setFields, sampleFields);

  // Generate and download file with styling support
  XLSX.writeFile(wb, xlsxFilename, { cellStyles: true });
};
