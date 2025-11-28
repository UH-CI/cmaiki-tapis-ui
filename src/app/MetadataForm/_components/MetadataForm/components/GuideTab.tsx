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
  Grid,
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
        <a
          href="https://docs.google.com/spreadsheets/d/14hTx0nX39dXBiDTjF8IObxEYiIGpWV0yjaxHyIA-Eno/edit?gid=1183505609#gid=1183505609"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            fontWeight: 'bold',
            textDecoration: 'underline',
          }}
        >
          Google Sheet C-MAIKI Metadata template
        </a>{' '}
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
        <a
          href="https://docs.google.com/spreadsheets/d/14hTx0nX39dXBiDTjF8IObxEYiIGpWV0yjaxHyIA-Eno/edit?gid=1183505609#gid=1183505609"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            fontWeight: 'bold',
            textDecoration: 'underline',
          }}
        >
          Google Sheet C-MAIKI Metadata template
        </a>{' '}
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

const AccordionHeader: React.FC<{
  icon: React.ElementType;
  color: string;
  title: string;
  chip?: string;
}> = ({ icon: Icon, color, title, chip }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Icon sx={{ mr: 1, color }} />
    <Typography variant="h6">
      {title}
      {chip && <Chip label={chip} size="small" sx={{ ml: 1 }} />}
    </Typography>
  </Box>
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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {fields.map((field) => (
          <Grid item xs={12} md={4} key={field.field_id}>
            <FieldCard field={field} />
          </Grid>
        ))}
      </Grid>
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
            1. Fill out your metadata in the{' '}
            <a
              href="https://docs.google.com/spreadsheets/d/14hTx0nX39dXBiDTjF8IObxEYiIGpWV0yjaxHyIA-Eno/edit?gid=1183505609#gid=1183505609"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                fontWeight: 'bold',
                textDecoration: 'underline',
              }}
            >
              Google Sheet C-MAIKI Metadata template
            </a>
            <br />
            2. Export as .xlsx when complete
            <br />
            3. Upload the .xlsx file to this validation tool
            <br />
            4. Review and correct any validation errors
            <br />
            5. Once validated, the metadata will be uploaded to your project
            directory
          </Typography>
        </Alert>
        <Typography variant="body1" paragraph>
          This form validates your genomics metadata and prepares it for
          submission. You can also enter data directly here or download your
          work for use in Google Sheets.
        </Typography>
        <Grid container spacing={2}>
          {QUICK_START_STEPS.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.step}>
              <StepCard {...item} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccordionHeader
            icon={TipsAndUpdatesIcon}
            color="warning.main"
            title="Key Features & Tips"
          />
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {TIPS_DATA.map((tip, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={tip.title} secondary={tip.content} />
                </ListItem>
                {index < TIPS_DATA.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccordionHeader
            icon={InfoIcon}
            color="error.main"
            title="Field Requirements & Validation"
          />
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccordionHeader
            icon={MenuBookIcon}
            color="secondary.main"
            title="Controlled Vocabulary Reference"
            chip={`${vocabularyFields.length} fields`}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Many fields use controlled vocabularies with predefined terms. This
            ensures data consistency across all submissions. For a
            comprehensive, searchable reference guide, visit the{' '}
            <a
              href="https://docs.google.com/spreadsheets/d/14hTx0nX39dXBiDTjF8IObxEYiIGpWV0yjaxHyIA-Eno/edit?gid=29549256#gid=29549256"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                fontWeight: 'bold',
                textDecoration: 'underline',
              }}
            >
              Vocabulary Reference (Google Sheets)
            </a>
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
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccordionHeader
            icon={InfoIcon}
            color="warning.main"
            title="Troubleshooting & FAQ"
          />
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {FAQ_ITEMS.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`Q: ${item.question}`}
                    secondary={
                      <Typography component="span" variant="body2">
                        A: {item.answer}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < FAQ_ITEMS.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
