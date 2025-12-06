import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import styles from './Projects.module.scss';

interface Contact {
  name: string;
  email: string;
  phone: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  primaryContact: Contact;
  secondaryContact?: Contact;
}

// TEMP
const projects: Project[] = [
  {
    id: '1',
    name: 'C-MAIKI Genomics',
    description: 'Bioinformatics tools and HPC resources for genomics research',
    primaryContact: {
      name: 'Dr. Jane Smith',
      email: 'genomics@cmaiki.org',
      phone: '(808) 555-0100',
    },
    secondaryContact: {
      name: 'John Doe',
      email: 'j.doe@cmaiki.org',
      phone: '(808) 555-0101',
    },
  },
  {
    id: '2',
    name: 'Climate Analysis',
    description: 'Climate change vulnerability mapping and analysis',
    primaryContact: {
      name: 'Dr. Maria Garcia',
      email: 'climate@cmaiki.org',
      phone: '(808) 555-0200',
    },
  },
];

const ContactInfo: React.FC<{ contact: Contact; label: string }> = ({
  contact,
  label,
}) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography
      variant="subtitle2"
      sx={{ color: '#465568', mb: 0.5, fontWeight: 600 }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
      {contact.name}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <EmailIcon sx={{ fontSize: 16, color: '#465568' }} />
      <Typography variant="body2" sx={{ color: '#495057' }}>
        {contact.email}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PhoneIcon sx={{ fontSize: 16, color: '#465568' }} />
      <Typography variant="body2" sx={{ color: '#495057' }}>
        {contact.phone}
      </Typography>
    </Box>
  </Box>
);

const Projects: React.FC = () => {
  return (
    <div className={styles['project-grid']}>
      {projects.map((project) => (
        <Card key={project.id} className={styles['project-card']} elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 600, color: '#465568', mb: 2 }}
            >
              {project.name}
            </Typography>

            <Divider sx={{ my: 2, borderColor: '#dee2e6' }} />

            <Typography
              variant="body1"
              sx={{
                mb: 3,
                lineHeight: 1.6,
                color: '#495057',
                minHeight: '60px',
              }}
            >
              {project.description}
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: '6px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <ContactInfo
                contact={project.primaryContact}
                label="Primary Contact"
              />
              {project.secondaryContact && (
                <>
                  <Divider sx={{ my: 1.5, borderColor: '#dee2e6' }} />
                  <ContactInfo
                    contact={project.secondaryContact}
                    label="Secondary Contact"
                  />
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Projects;
