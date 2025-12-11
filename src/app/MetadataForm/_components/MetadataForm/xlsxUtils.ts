import * as XLSX from 'xlsx';
import {
  MetadataFieldDef,
  SampleData,
  MultiSampleMetadata,
} from './metadataUtils';

// Cell mappings for project metadata extraction
const PROJECT_METADATA_CELLS: { [key: string]: string } = {
  B3: 'project_name',
  F3: 'project_description',
  B4: 'project_uuid',
  B8: 'point_of_contact',
  B9: 'point_of_contact_email',
  F8: 'secondary_point_of_contact',
  F9: 'secondary_point_of_contact_email',
  J8: 'sequencing_point_of_contact',
  J9: 'sequencing_point_of_contact_email',
};

const extractProjectMetadata = (
  worksheet: XLSX.WorkSheet,
  validFieldIds: Set<string>
): { [key: string]: string } => {
  const projectMetadata: { [key: string]: string } = {};

  Object.entries(PROJECT_METADATA_CELLS).forEach(([cell, fieldId]) => {
    const cellValue = worksheet[cell];
    if (cellValue?.v) {
      const value = String(cellValue.v).trim();
      if (value && !validFieldIds.has(value)) {
        projectMetadata[fieldId] = value;
      }
    }
  });

  return projectMetadata;
};

const findHeaderRow = (
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  expectedFieldIds: string[]
): number => {
  // Check rows 11 and 12 (indices 10 and 11)
  for (const rowIndex of [10, 11]) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      const cell = worksheet[cellAddress];
      if (cell?.v && expectedFieldIds.includes(String(cell.v).trim())) {
        return rowIndex;
      }
    }
  }
  return -1;
};

const extractHeaders = (
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  headerRowIndex: number
): { headers: string[]; headerColumnMap: { [key: string]: number } } => {
  const headers: string[] = [];
  const headerColumnMap: { [key: string]: number } = {};

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    const cell = worksheet[cellAddress];
    const header = cell?.v ? String(cell.v).trim() : '';
    headers.push(header);
    if (header) {
      headerColumnMap[header] = col;
    }
  }

  return { headers, headerColumnMap };
};

const parseSampleData = (
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  headerRowIndex: number,
  matchedColumns: string[],
  headerColumnMap: { [key: string]: number }
): SampleData[] => {
  const sampleData: SampleData[] = [];
  const dataStartRow = headerRowIndex + 1;

  for (let row = dataStartRow; row <= range.e.r; row++) {
    const rowData: SampleData = {};
    let hasData = false;

    for (const header of matchedColumns) {
      const col = headerColumnMap[header];
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (cell?.v !== undefined && cell.v !== null) {
        let value: string;

        // Handle date cells
        if (cell.v instanceof Date) {
          const year = cell.v.getFullYear();
          const month = String(cell.v.getMonth() + 1).padStart(2, '0');
          const day = String(cell.v.getDate()).padStart(2, '0');
          value = `${year}-${month}-${day}`;
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

  return sampleData;
};

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

        const sheetName = workbook.SheetNames.includes('Sample Metadata')
          ? 'Sample Metadata'
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        const validFieldIds = new Set([
          'project_uuid',
          ...sampleFields.map((f) => f.field_id),
        ]);

        const projectMetadata = extractProjectMetadata(
          worksheet,
          validFieldIds
        );

        const expectedFieldIds = [
          'sample_id',
          ...sampleFields.map((field) => field.field_id),
        ];

        const headerRowIndex = findHeaderRow(
          worksheet,
          range,
          expectedFieldIds
        );

        if (headerRowIndex === -1) {
          resolve({
            success: false,
            errors: [
              'Could not find header row in the XLSX file.',
              'Headers should be in row 11 or row 12.',
              `Expected field IDs include: ${expectedFieldIds
                .slice(0, 5)
                .join(', ')}...`,
            ],
          });
          return;
        }

        const { headers, headerColumnMap } = extractHeaders(
          worksheet,
          range,
          headerRowIndex
        );

        const matchedColumns = headers.filter((h) =>
          expectedFieldIds.includes(h)
        );
        const unmatchedColumns = headers.filter(
          (h) => h && !expectedFieldIds.includes(h)
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

        const sampleData = parseSampleData(
          worksheet,
          range,
          headerRowIndex,
          matchedColumns,
          headerColumnMap
        );

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

const createMetadataWorksheetData = (
  multiSampleData: MultiSampleMetadata,
  sampleFields: MetadataFieldDef[]
): any[][] => {
  const wsData: any[][] = [
    ['C-MAIKI Gateway Metadata Template'],
    [],
    [
      'Project Name:',
      multiSampleData.setWideFields.project_name || '',
      '',
      '',
      'Project Description:',
      multiSampleData.setWideFields.project_description || '',
    ],
    ['Project UUID:', multiSampleData.setWideFields.project_uuid || ''],
    [],
    [
      'Primary Point of Contact:',
      '',
      '',
      '',
      'Secondary Point of Contact:',
      '',
      '',
      '',
      'Sequencing Point of Contact:',
    ],
    [
      '(Main project coordinator and primary contact for all inquiries)',
      '',
      '',
      '',
      '(Backup contact for project-related questions and coordination)',
      '',
      '',
      '',
      '(Contact for sequencing facility and run-specific information)',
    ],
    [
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
    ],
    [
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
    ],
    [],
    ['sample_id', ...sampleFields.map((field) => field.field_id)],
  ];

  multiSampleData.samples.forEach((sample) => {
    wsData.push([
      sample.sample_id || '',
      ...sampleFields.map((field) => sample[field.field_id] || ''),
    ]);
  });

  return wsData;
};

const styleWorksheet = (ws: XLSX.WorkSheet, headers: string[]): void => {
  ws['!cols'] = headers.map((header) => ({
    wch: Math.max(header.length, 15),
  }));

  ws['!merges'] = [
    XLSX.utils.decode_range('A1:J1'),
    XLSX.utils.decode_range('B3:C3'),
    XLSX.utils.decode_range('F3:J3'),
    XLSX.utils.decode_range('B4:E4'),
    XLSX.utils.decode_range('A6:D6'),
    XLSX.utils.decode_range('E6:H6'),
    XLSX.utils.decode_range('I6:L6'),
    XLSX.utils.decode_range('A7:D7'),
    XLSX.utils.decode_range('E7:H7'),
    XLSX.utils.decode_range('I7:L7'),
    XLSX.utils.decode_range('B8:C8'),
    XLSX.utils.decode_range('F8:G8'),
    XLSX.utils.decode_range('J8:K8'),
    XLSX.utils.decode_range('B9:C9'),
    XLSX.utils.decode_range('F9:G9'),
    XLSX.utils.decode_range('J9:K9'),
  ];

  const titleStyle = { font: { bold: true, sz: 18 } };
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
  const labelStyle = { font: { bold: true, sz: 11 } };

  if (ws['A1']) ws['A1'].s = titleStyle;
  if (ws['A4']) ws['A4'].s = labelStyle;

  headers.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 10, c: idx });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = headerStyle;
  });
};

const generateMetadataWorkbook = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const wsData = createMetadataWorksheetData(multiSampleData, sampleFields);
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const headers = ['sample_id', ...sampleFields.map((field) => field.field_id)];

  styleWorksheet(ws, headers);
  XLSX.utils.book_append_sheet(wb, ws, 'Sample Metadata');

  return wb;
};

export const generateMetadataXLSXBlob = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[]
): { blob: Blob; filename: string } => {
  const wb = generateMetadataWorkbook(multiSampleData, setFields, sampleFields);
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

export const downloadMetadataXLSX = (
  multiSampleData: MultiSampleMetadata,
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  filename?: string
) => {
  const xlsxFilename =
    filename || `${multiSampleData.setWideFields.project_name}_metadata.xlsx`;
  const wb = generateMetadataWorkbook(multiSampleData, setFields, sampleFields);
  XLSX.writeFile(wb, xlsxFilename, { cellStyles: true });
};
