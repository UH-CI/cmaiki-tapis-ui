import React, { useState } from 'react';
import { Typography, Divider, IconButton, Tooltip } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import citationsData from '../citations.json';
import styles from './Citations.module.scss';

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

const Citations: React.FC = () => {
  return (
    <div className={styles['container']}>
      {citationsData.map((section) => (
        <div key={section.section} className={styles['section']}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: '#465568' }}
          >
            {section.section}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {section.entries.map((entry, i) => (
            <div key={i} className={styles['entry']}>
              <CopyButton text={entry.body} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {entry.header}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: '#6c757d', mb: 0.75 }}
              >
                {entry.subheader}
              </Typography>
              <Typography variant="body2">{entry.body}</Typography>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Citations;
