import React, { useState } from 'react';
import { Typography, Divider, IconButton, Tooltip, Chip } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import citationsData from '../citations.json';
import styles from './Citations.module.scss';

interface Example {
  label?: string;
  link?: string;
  text: string;
}

interface Entry {
  header: string;
  subheader?: string;
  citation?: string;
  link?: string;
  pending?: boolean;
  example?: Example;
}

interface Section {
  section: string;
  note?: string;
  entries: Entry[];
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy citation'}>
      <IconButton
        size="small"
        onClick={handleCopy}
        className={styles['copy-button']}
      >
        {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

const CitationLink: React.FC<{ href: string }> = ({ href }) => (
  <Typography variant="body2" className={styles['link']}>
    <a href={href} target="_blank" rel="noopener noreferrer">
      {href}
    </a>
  </Typography>
);

const Citations: React.FC = () => {
  const { intro, sections } = citationsData as {
    intro: string;
    sections: Section[];
  };

  return (
    <div className={styles['container']}>
      <Typography variant="body1" className={styles['intro']}>
        {intro}
      </Typography>

      {sections.map((section) => (
        <div key={section.section} className={styles['section']}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: '#465568' }}
          >
            {section.section}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {section.note && (
            <Typography variant="body2" className={styles['section-note']}>
              {section.note}
            </Typography>
          )}
          {section.entries.map((entry, i) => (
            <div key={i} className={styles['entry']}>
              {entry.citation && <CopyButton text={entry.citation} />}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {entry.header}
                {entry.pending && (
                  <Chip
                    label="Pending"
                    size="small"
                    className={styles['pending-chip']}
                  />
                )}
              </Typography>
              {entry.subheader && (
                <Typography
                  variant="subtitle2"
                  sx={{ color: '#6c757d', mb: 0.75 }}
                >
                  {entry.subheader}
                </Typography>
              )}
              {entry.citation && (
                <Typography variant="body2">{entry.citation}</Typography>
              )}
              {entry.link && <CitationLink href={entry.link} />}

              {entry.example && (
                <div className={styles['example']}>
                  {entry.example.label && (
                    <Typography
                      variant="caption"
                      className={styles['example-label']}
                    >
                      {entry.example.label}
                    </Typography>
                  )}
                  {entry.example.link && (
                    <CitationLink href={entry.example.link} />
                  )}
                  <Typography
                    variant="body2"
                    className={styles['example-text']}
                  >
                    {entry.example.text}
                  </Typography>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Citations;
