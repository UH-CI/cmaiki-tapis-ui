import * as XLSX from 'xlsx';
import {
  MetadataFieldDef,
  SampleData,
  MultiSampleMetadata,
} from './metadataUtils';

/**
 * Cell mapping for project-level metadata in the XLSX template
 * Based on the C-MAIKI template structure (rows 1-9)
 */
const PROJECT_METADATA_CELLS = {
  // Row 3 - User and PI information
  project_name: 'B3',
  project_description: 'J3',

  // Row 7-8 - Contact information for DNA processing
  point_of_contact_name: 'B7',
  point_of_contact_email_row8: 'B8',

  // Row 7-8 - Contact information for PCR/library prep
  secondary_point_of_contact: 'F7',
  secondary_point_of_contact_email: 'F8',

  // Row 7-8 - Contact information for library QC
  sequencing_point_of_contact: 'J7',
  sequencing_point_of_contact_email: 'J8',
};

// Row where data headers are located
const HEADER_ROW = 10;

// Row where data starts
const DATA_START_ROW = 11;

/**
 * Parse XLSX file and extract both project metadata and sample data
 */
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

        // Extract project-level metadata from specific cells
        const projectMetadata: { [key: string]: string } = {};

        const cellMappings: { [key: string]: string } = {
          B3: 'project_name',
          J3: 'project_description',
          B7: 'point_of_contact',
          B8: 'point_of_contact_email',
          F7: 'secondary_point_of_contact',
          F8: 'secondary_point_of_contact_email',
          J7: 'sequencing_point_of_contact',
          J8: 'sequencing_point_of_contact_email',
        };

        Object.entries(cellMappings).forEach(([cell, fieldId]) => {
          const cellValue = worksheet[cell];
          if (cellValue && cellValue.v) {
            const value = String(cellValue.v).trim();
            if (value && value !== 'Name' && value !== 'Email') {
              projectMetadata[fieldId] = value;
            }
          }
        });

        // Extract project_name from cell B2 or nearby
        const projectNameCell = worksheet['B2'] || worksheet['A2'];
        if (projectNameCell && projectNameCell.v) {
          projectMetadata['project_name'] = String(projectNameCell.v).trim();
        }

        // Parse sample data starting from row 10 (headers) and row 11 (data)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        // Get headers from row 10
        const headers: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 9, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            headers.push(String(cell.v).trim());
          } else {
            headers.push('');
          }
        }

        // Match headers with expected sample fields
        const fieldIds = sampleFields.map((field) => field.field_id);
        const matchedColumns = headers.filter((header) =>
          fieldIds.includes(header)
        );
        const unmatchedColumns = headers.filter(
          (header) => header && !fieldIds.includes(header)
        );

        if (matchedColumns.length === 0) {
          resolve({
            success: false,
            errors: [
              'No matching columns found in the XLSX file.',
              'Please ensure row 10 contains column headers that match the expected field IDs.',
            ],
            unmatchedColumns,
          });
          return;
        }

        // Parse data rows starting from row 11
        const sampleData: SampleData[] = [];
        const errors: string[] = [];

        for (let row = 10; row <= range.e.r; row++) {
          const rowData: SampleData = {};
          let hasData = false;

          for (let col = 0; col < headers.length; col++) {
            const header = headers[col];
            if (matchedColumns.includes(header)) {
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
                    const month = String(cell.v.getMonth() + 1).padStart(
                      2,
                      '0'
                    );
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
          }

          if (hasData) {
            sampleData.push(rowData);
          }
        }

        const warnings =
          unmatchedColumns.length > 0
            ? [
                `Found ${
                  unmatchedColumns.length
                } unmatched columns: ${unmatchedColumns.join(', ')}`,
              ]
            : undefined;

        resolve({
          success: true,
          projectMetadata,
          sampleData,
          matchedColumns,
          unmatchedColumns,
          warnings,
          errors: errors.length > 0 ? errors : undefined,
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
 * Generate XLSX file matching the C-MAIKI template format
 */
export const downloadMetadataXLSX = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  filename?: string
) => {
  const xlsxFilename =
    filename || `${multiSampleData.setWideFields.project_name}_metadata.xlsx`;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet data as array of arrays
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
    // 'Name of PI:',
    // multiSampleData.setWideFields.investigator || '',
    // '',
    // '',
    'Project Description:',
    multiSampleData.setWideFields.project_description || '',
  ];

  // Row 4: Empty
  wsData[3] = [];

  // Row 5: Contact section labels
  wsData[4] = [
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

  // Row 6: Description text
  wsData[5] = [
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

  // Row 7: Contact names
  wsData[6] = [
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

  // Row 8: Contact emails
  wsData[7] = [
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

  // Row 9: Empty
  wsData[8] = [];

  // Row 10: Column headers (field IDs)
  const headers = sampleFields.map((field) => field.field_id);
  wsData[9] = headers;

  // Row 11+: Sample data
  multiSampleData.samples.forEach((sample) => {
    const row = sampleFields.map((field) => sample[field.field_id] || '');
    wsData.push(row);
  });

  // Create worksheet from array
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = headers.map((header) => {
    // Base width on header length or common field widths
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
  ws['!merges'].push(XLSX.utils.decode_range('F3:G3'));
  ws['!merges'].push(XLSX.utils.decode_range('J3:K3'));

  // Row 5 merges (labels)
  ws['!merges'].push(XLSX.utils.decode_range('A5:D5'));
  ws['!merges'].push(XLSX.utils.decode_range('E5:H5'));
  ws['!merges'].push(XLSX.utils.decode_range('I5:L5'));

  // Row 6 merges (descriptions)
  ws['!merges'].push(XLSX.utils.decode_range('A6:D6'));
  ws['!merges'].push(XLSX.utils.decode_range('E6:H6'));
  ws['!merges'].push(XLSX.utils.decode_range('I6:L6'));

  // Row 7 merges (name values)
  ws['!merges'].push(XLSX.utils.decode_range('B7:C7'));
  ws['!merges'].push(XLSX.utils.decode_range('F7:G7'));
  ws['!merges'].push(XLSX.utils.decode_range('J7:K7'));

  // Row 8 merges (email values)
  ws['!merges'].push(XLSX.utils.decode_range('B8:C8'));
  ws['!merges'].push(XLSX.utils.decode_range('F8:G8'));
  ws['!merges'].push(XLSX.utils.decode_range('J8:K8'));

  // Styling
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

  // Style title cell (A1)
  if (ws['A1']) {
    ws['A1'].s = titleStyle;
  }

  // Style header row
  headers.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 9, c: idx });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = headerStyle;
  });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sample Metadata');

  // Generate and download file with styling support
  XLSX.writeFile(wb, xlsxFilename, { cellStyles: true });
};
