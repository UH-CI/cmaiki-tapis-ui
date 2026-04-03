import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { MetadataSchema } from '../metadataUtils';

interface GuideTabProps {
  metadataSchema: MetadataSchema;
}

interface VocabularyField {
  field_id: string;
  field_name: string;
  options: string[];
  definition?: string;
  dynamic?: boolean;
  dynamicOptions?: {
    based_on: string;
    option_map: Record<string, string[]>;
  };
}

const METADATA_TEMPLATE_URL =
  'https://docs.google.com/spreadsheets/d/1em4_MapbMJjmeX7C6iGq8WtzA9lOLjC-irbxRVNgJYQ/edit?gid=1183505609#gid=1183505609';
const METADATA_TERMS_URL =
  'https://docs.google.com/spreadsheets/d/1em4_MapbMJjmeX7C6iGq8WtzA9lOLjC-irbxRVNgJYQ/edit?gid=29549256#gid=29549256';

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: 'inherit',
      fontWeight: 'bold',
      textDecoration: 'underline',
    }}
  >
    {children}
  </a>
);

const QUICK_START_STEPS = [
  {
    step: '1',
    title: 'Import or Enter Data',
    description:
      'Upload an .xlsx file or enter project and sample information directly',
  },
  {
    step: '2',
    title: 'Review Fields',
    description: 'Complete all required fields and verify data accuracy',
  },
  {
    step: '3',
    title: 'Validate',
    description: 'Check for errors and ensure all requirements are met',
  },
  {
    step: '4',
    title: 'Submit or Export',
    description:
      'Upload validated metadata to your project or download as .xlsx',
  },
];

const TIPS_DATA: Array<{ title: string; content: React.ReactNode }> = [
  {
    title: 'Searchable Dropdowns',
    content:
      'All dropdown fields support type-to-search functionality. Start typing to filter options instantly.',
  },
  {
    title: 'Bulk Import',
    content: (
      <>
        Use the 'Upload XLSX' button to upload multiple samples at once. The
        tool will search for matching column headers. For best results, use the{' '}
        <ExternalLink href={METADATA_TEMPLATE_URL}>
          Google Sheet C-MAIKI Metadata template
        </ExternalLink>{' '}
        which has the correct column headers and formatting.
      </>
    ),
  },
  {
    title: 'Copy & Paste Rows',
    content:
      'Select one or more sample rows and use the copy button to duplicate data. Then select target rows and paste. Perfect for samples with similar metadata.',
  },
  {
    title: 'Dynamic Fields',
    content:
      'Some fields show different options based on previous selections. For example, EMPO Level 2 options change based on your EMPO Level 1 selection.',
  },
  {
    title: 'Inline Validation',
    content:
      'Required field column headers are in bold and marked with an asterisk (*). Hover over column headers to see examples and formatting requirements.',
  },
  {
    title: 'Auto-generated IDs',
    content:
      'Sample IDs and Project UUIDs are automatically generated upon successful validation. The sample ID format is based on your sample name field.',
  },
  {
    title: 'Keyboard Shortcuts',
    content:
      'Tab moves to cell on right, Shift+Tab moves to cell on left. Enter moves a cell down, Shift+Enter moves a cell up.',
  },
];

const FAQ_ITEMS: Array<{ question: string; answer: React.ReactNode }> = [
  {
    question: "Why can't I generate the XLSX file?",
    answer:
      "You must first click 'Validate' and fix any reported errors. The system ensures all required fields are filled and properly formatted before allowing file generation.",
  },
  {
    question: 'Some dropdown options seem missing. Why?',
    answer:
      "Many fields have dynamic options that change based on previous selections. Make sure you've filled out prerequisite fields first (e.g., EMPO Level 1 must be selected before EMPO Level 2 options appear).",
  },
  {
    question: 'Can I save my progress and return later?',
    answer: (
      <>
        The form does not auto-save. We recommend completing your metadata in
        the{' '}
        <ExternalLink href={METADATA_TEMPLATE_URL}>
          Google Sheet C-MAIKI Metadata template
        </ExternalLink>{' '}
        and using this tool to validate and edit. Alternatively, you can export
        your work to XLSX as a backup and import it later to resume.
      </>
    ),
  },
  {
    question: 'I accidentally cleared my data. Can I undo?',
    answer:
      "There is no undo function. Please be careful when using the 'Clear Rows' function. Consider copying rows before clearing as a precaution.",
  },
];

const SAMPLESET_FIELD_IDS = [
  'point_of_contact',
  'point_of_contact_email',
  'secondary_point_of_contact',
  'secondary_point_of_contact_email',
  'sequencing_point_of_contact',
  'sequencing_point_of_contact_email',
];

const GuideAccordion: React.FC<{
  icon: React.ElementType;
  color: string;
  title: string;
  chip?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, color, title, chip, defaultExpanded, children }) => (
  <Accordion defaultExpanded={defaultExpanded}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Icon sx={{ mr: 1, color }} />
        <Typography variant="h6">
          {title}
          {chip && <Chip label={chip} size="small" sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const DividedList: React.FC<{
  items: Array<{ primary: React.ReactNode; secondary: React.ReactNode }>;
  renderIcon?: () => React.ReactNode;
}> = ({ items, renderIcon }) => (
  <List>
    {items.map((item, index) => (
      <React.Fragment key={index}>
        <ListItem>
          {renderIcon && <ListItemIcon>{renderIcon()}</ListItemIcon>}
          <ListItemText primary={item.primary} secondary={item.secondary} />
        </ListItem>
        {index < items.length - 1 && <Divider component="li" />}
      </React.Fragment>
    ))}
  </List>
);

const StepCard: React.FC<{
  step: string;
  title: string;
  description: string;
}> = ({ step, title, description }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          mb: 1,
          fontWeight: 'bold',
        }}
      >
        {step}
      </Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const FieldCard: React.FC<{ field: any }> = ({ field }) => (
  <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
    <Typography variant="body2" fontWeight="bold" color="primary.main">
      {field.field_name}
      {field.required && (
        <Chip
          label="Required"
          size="small"
          color="error"
          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
        />
      )}
    </Typography>
    {field.definition && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5, fontStyle: 'italic' }}
      >
        {field.definition}
      </Typography>
    )}
    <Typography
      variant="body2"
      color="text.primary"
      sx={{ mt: 1, fontWeight: 500 }}
    >
      Validation: {field.validation_description}
    </Typography>
  </Paper>
);

const VocabularyFieldCard: React.FC<{ field: VocabularyField }> = ({
  field,
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1,
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        {field.field_name}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Chip
          label={`${field.options.length} terms`}
          size="small"
          color="primary"
          variant="outlined"
        />
        {field.dynamic && (
          <Chip
            label="Dynamic"
            size="small"
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>
    </Box>
    {field.definition && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, fontStyle: 'italic' }}
      >
        {field.definition}
      </Typography>
    )}
    {field.dynamic && field.dynamicOptions && (
      <Typography
        variant="body2"
        color="primary.main"
        sx={{ mb: 1, fontWeight: 500 }}
      >
        ↳ Options depend on: {field.dynamicOptions.based_on}
      </Typography>
    )}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
      {field.dynamic && field.dynamicOptions
        ? Object.entries(field.dynamicOptions.option_map).map(
            ([parentValue, childOptions]) => (
              <Box
                key={parentValue}
                sx={{
                  width: '100%',
                  mb: 1,
                  pl: 2,
                  borderLeft: '3px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                >
                  {parentValue}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {childOptions.map((option, idx) => (
                    <Chip
                      key={idx}
                      label={option}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )
          )
        : field.options.map((option, idx) => (
            <Chip
              key={idx}
              label={option}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
    </Box>
  </Paper>
);

const FieldGroup: React.FC<{
  title: string;
  description: string;
  fields: any[];
}> = ({ title, description, fields }) =>
  fields.length > 0 ? (
    <>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        gutterBottom
        sx={{ mt: 2 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {fields.map((field) => (
          <Box key={field.field_id}>
            <FieldCard field={field} />
          </Box>
        ))}
      </Box>
    </>
  ) : null;

export const GuideTab: React.FC<GuideTabProps> = ({ metadataSchema }) => {
  const vocabularyFields = useMemo(() => {
    const fields: VocabularyField[] = [];
    const optionsMap = new Map<string, VocabularyField>();

    metadataSchema.fields.forEach((field) => {
      if (field.input_type !== 'dropdown') return;

      let fieldData: VocabularyField | null = null;

      if (field.options && field.options.length > 0) {
        fieldData = {
          field_id: field.field_id,
          field_name: field.field_name,
          options: field.options,
          definition: field.definition,
          dynamic: false,
        };
      } else if (field.dynamic_options?.option_map) {
        fieldData = {
          field_id: field.field_id,
          field_name: field.field_name,
          options: Object.values(field.dynamic_options.option_map).flat(),
          definition: field.definition,
          dynamic: true,
          dynamicOptions: field.dynamic_options,
        };
      }

      if (fieldData) {
        const optionsKey = [...fieldData.options].sort().join('|');
        const existing = optionsMap.get(optionsKey);
        if (existing && !fieldData.dynamic && !existing.dynamic) {
          existing.field_name = `${existing.field_name} / ${fieldData.field_name}`;
        } else {
          optionsMap.set(optionsKey, fieldData);
          fields.push(fieldData);
        }
      }
    });

    return fields.sort((a, b) => a.field_name.localeCompare(b.field_name));
  }, [metadataSchema]);

  const { samplesetFields, sampleFields } = useMemo(() => {
    const fieldsWithValidation = metadataSchema.fields.filter(
      (field) => field.validation_description
    );
    return {
      samplesetFields: fieldsWithValidation.filter((field) =>
        SAMPLESET_FIELD_IDS.includes(field.field_id)
      ),
      sampleFields: fieldsWithValidation.filter(
        (field) => !SAMPLESET_FIELD_IDS.includes(field.field_id)
      ),
    };
  }, [metadataSchema]);

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            Quick Start Guide
          </Typography>
        </Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Recommended Workflow:
          </Typography>
          <Typography variant="body2">
            1. <strong>Make a copy</strong> of the{' '}
            <ExternalLink href={METADATA_TEMPLATE_URL}>
              Google Sheet C-MAIKI Metadata template
            </ExternalLink>{' '}
            (File → Make a copy)
            <br />
            2. Fill out your metadata in <strong>your own copy</strong>
            <br />
            3. Export your copy as .xlsx when complete
            <br />
            4. Upload the .xlsx file to this validation tool
            <br />
            5. Review and correct any validation errors
            <br />
            6. Once validated, upload the metadata file directory
          </Typography>
        </Alert>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Using this metadata to run C-MĀIKI Gateway pipelines?
          </Typography>
          <Typography variant="body2" gutterBottom>
            The C-MĀIKI Gateway requires and validates your metadata against
            your FASTQ files before any job runs. Every read file must match a{' '}
            <strong>samp_name</strong> entry in your metadata. Jobs will not
            proceed if any files are unaccounted for.
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>*NOTE:</strong> If you are unsure what to enter for{' '}
            <strong>samp_name</strong>, use the sample names from your
            sequencing facility's mapping file — these names correspond directly
            to the beginning of your FASTQ filenames.
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            <strong>Matching rules for samp_name:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
              <li>
                The samp_name must match the <strong>beginning</strong> of the
                filename (before the extension). Sequencer suffixes like{' '}
                <code>_S1</code>, <code>_L001</code>, <code>_R1</code>,{' '}
                <code>_R2</code>, or <code>_001</code> are allowed after the
                name — but arbitrary suffixes like <code>-replicate</code> or{' '}
                <code>_extra</code> are not.
              </li>
              <li>
                Matching is <strong>case-insensitive</strong>. Consecutive
                underscores are collapsed, and leading/trailing underscores are
                ignored.
              </li>
              <li>
                <strong>
                  R1 and R2 files are each validated against the same samp_name
                </strong>{' '}
                — one metadata entry covers both.
              </li>
              <li>
                Index reads (<code>_I1</code> / <code>_I2</code>) are
                automatically skipped and do not need a metadata entry.
              </li>
            </ul>
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Example — samp_name: <code>SAMPLE-001</code>
            </Typography>
            <Typography
              variant="body2"
              color="success.main"
              fontWeight="bold"
              sx={{ mt: 1 }}
            >
              ✓ Would match:
            </Typography>
            {[
              'SAMPLE-001_S1_L001_R1_001.fastq.gz',
              'SAMPLE-001_R2.fastq.gz',
            ].map((f, i) => (
              <Typography key={i} variant="body2" sx={{ pl: 2 }}>
                <code>{f}</code>
              </Typography>
            ))}
            <Typography
              variant="body2"
              color="error.main"
              fontWeight="bold"
              sx={{ mt: 1 }}
            >
              ✗ Would not match:
            </Typography>
            {[
              'SAMPLE-001-replicate_R1.fastq.gz',
              'SAMPLE-001_extra_R1.fastq.gz',
            ].map((f, i) => (
              <Typography key={i} variant="body2" sx={{ pl: 2 }}>
                <code>{f}</code>
              </Typography>
            ))}
          </Paper>
        </Alert>

        <Typography variant="body1" paragraph>
          This form validates your genomics metadata and prepares it for
          submission. You can also enter data directly here or download your
          work for use in Google Sheets.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          {QUICK_START_STEPS.map((item) => (
            <Box key={item.step}>
              <StepCard {...item} />
            </Box>
          ))}
        </Box>
      </Paper>

      <GuideAccordion
        icon={CloudUploadIcon}
        color="secondary.main"
        title="Bulk Import"
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use the <strong>Upload XLSX</strong> button to import project metadata
          and sample data from a spreadsheet all at once.
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Steps:</strong>
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          <ol style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
            <li>
              Click <strong>Upload XLSX</strong> and select your{' '}
              <code>.xlsx</code> or <code>.xls</code> file.
            </li>
            <li>
              A preview dialog will show matched columns and the first 5 sample
              rows.
            </li>
            <li>
              Click <strong>Import Data</strong> to apply. Project metadata
              fields and all matched sample columns will be populated.
            </li>
          </ol>
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Expected file format
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The tool is designed for the{' '}
            <ExternalLink href={METADATA_TEMPLATE_URL}>
              C-MAIKI Metadata template
            </ExternalLink>
            . It reads from the sheet named <strong>"Sample Metadata"</strong>,
            or the first sheet if that name is not found.
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Project metadata</strong> is read from fixed cells:
            <ul style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
              <li>
                <code>B3</code> — Project Name, <code>F3</code> — Project
                Description
              </li>
              <li>
                <code>B4</code> — Project UUID
              </li>
              <li>
                <code>B8/B9</code> — Primary contact name/email
              </li>
              <li>
                <code>F8/F9</code> — Secondary contact name/email
              </li>
              <li>
                <code>J8/J9</code> — Sequencing contact name/email
              </li>
            </ul>
            <strong>Sample column headers</strong> are detected in row 11 or 12.
            Headers must exactly match field IDs (case-sensitive). Sample data
            begins on the row immediately after the header row. Empty rows are
            skipped.
          </Typography>
        </Alert>

        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Partial imports are fine
          </Typography>
          <Typography variant="body2">
            Only columns whose headers match known field IDs are imported.
            Unmatched columns generate a warning in the preview dialog but do
            not block the import. Date cells are automatically converted to{' '}
            <code>YYYY-MM-DD</code> format.
          </Typography>
        </Alert>

        <Alert severity="warning">
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            If the import fails
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
              <li>
                <strong>No header row found</strong> — the tool could not find
                any known field ID in rows 11 or 12. Check that your column
                headers are field IDs (e.g. <code>samp_name</code>, not display
                names like "Sample Name").
              </li>
              <li>
                <strong>No matching columns</strong> — headers were found but
                none matched. The preview dialog will show what was found in
                that row to help you diagnose.
              </li>
            </ul>
          </Typography>
        </Alert>
      </GuideAccordion>

      <GuideAccordion
        icon={CloudUploadIcon}
        color="secondary.main"
        title="Importing Sample Names"
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Auto-populate the <code>samp_name</code> column from FASTQ filenames
          on Koa. The names are extracted using the same parsing rules applied
          for C-MĀIKI Gateway metadata validation, making this a good starting
          point for ensuring your sample names correspond correctly to your
          files and pass validation.
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Steps:</strong>
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          <ol style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
            <li>
              Click <strong>Import Sample Names from Files</strong> to open the
              file browser.
            </li>
            <li>Navigate to the directory containing your FASTQ files.</li>
            <li>
              Click <strong>Import N sample names</strong> to populate the{' '}
              <code>samp_name</code> column.
            </li>
          </ol>
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            How sample names are extracted
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: '4px 0', paddingLeft: '1.4em' }}>
              <li>
                Only FASTQ files are considered: <code>.fastq.gz</code>,{' '}
                <code>.fq.gz</code>, <code>.fastq</code>, <code>.fq</code>. All
                other files are ignored.
              </li>
              <li>
                Index reads (<code>_I1</code> / <code>_I2</code>) are skipped
                automatically.
              </li>
              <li>
                Recognized sequencer suffixes are stripped: <code>_S1</code>,{' '}
                <code>_L001</code>, <code>_R1</code>/<code>_R2</code>,{' '}
                <code>_001</code>, etc.
              </li>
              <li>
                R1 and R2 files for the same sample are deduplicated — one{' '}
                <code>samp_name</code> entry is created per sample.
              </li>
            </ul>
          </Typography>
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Example
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            These two files both produce <code>samp_name</code>:{' '}
            <strong>SAMPLE-001</strong>
          </Typography>
          {[
            'SAMPLE-001_S1_L001_R1_001.fastq.gz',
            'SAMPLE-001_S1_L001_R2_001.fastq.gz',
          ].map((f, i) => (
            <Typography key={i} variant="body2" sx={{ pl: 1 }}>
              <code>{f}</code>
            </Typography>
          ))}
        </Paper>

        <Alert severity="warning">
          <Typography variant="body2">
            This button is disabled if any <code>samp_name</code> values are
            already filled in. Clear the <code>samp_name</code> column first if
            you want to re-import from files.
          </Typography>
        </Alert>
      </GuideAccordion>

      <GuideAccordion
        icon={TipsAndUpdatesIcon}
        color="warning.main"
        title="Key Features & Tips"
        defaultExpanded
      >
        <DividedList
          items={TIPS_DATA.map((t) => ({
            primary: t.title,
            secondary: t.content,
          }))}
          renderIcon={() => <CheckCircleIcon color="success" />}
        />
      </GuideAccordion>

      <GuideAccordion
        icon={InfoIcon}
        color="error.main"
        title="Field Requirements & Validation"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          The validation system checks your data against strict requirements
          before allowing XLSX generation. This ensures data quality and
          consistency.
        </Alert>
        <FieldGroup
          title="Sample Set Fields"
          description="These fields apply to your entire sample set and are entered once in the Project Information tab."
          fields={samplesetFields}
        />
        <FieldGroup
          title="Sample Fields"
          description="These fields are entered for each individual sample in the Sample Data tab."
          fields={sampleFields}
        />
      </GuideAccordion>

      <GuideAccordion
        icon={MenuBookIcon}
        color="secondary.main"
        title="Controlled Vocabulary Reference"
        chip={`${vocabularyFields.length} fields`}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Many fields use controlled vocabularies with predefined terms. This
          ensures data consistency across all submissions. For a comprehensive,
          searchable reference guide, visit the{' '}
          <ExternalLink href={METADATA_TERMS_URL}>
            Vocabulary Reference (Google Sheets)
          </ExternalLink>
          .
        </Alert>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Quick Reference - All Vocabulary Fields
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Below is a quick reference showing all {vocabularyFields.length}{' '}
          controlled vocabulary fields used in this form.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {vocabularyFields.map((field) => (
            <VocabularyFieldCard key={field.field_id} field={field} />
          ))}
        </Box>
      </GuideAccordion>

      <GuideAccordion
        icon={InfoIcon}
        color="warning.main"
        title="Troubleshooting & FAQ"
      >
        <DividedList
          items={FAQ_ITEMS.map((item) => ({
            primary: item.question,
            secondary: item.answer,
          }))}
        />
      </GuideAccordion>
    </Box>
  );
};
