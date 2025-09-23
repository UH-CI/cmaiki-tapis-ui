import React, { useState } from 'react';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import styles from '../MetadataForm.module.scss';

interface ValidationErrorDetailsProps {
  errors: Record<string, string[]>;
  errorCount: number;
}

export const ValidationErrorDetails: React.FC<ValidationErrorDetailsProps> = ({
  errors,
  errorCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (errorCount === 0) {
    return null;
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className={styles['validation-error-container']}>
      <div
        className={styles['validation-error-header']}
        onClick={toggleExpanded}
      >
        <span className={styles['validation-error-title']}>
          Validation Errors
        </span>
        <button
          className={styles['validation-error-toggle']}
          onClick={toggleExpanded}
          aria-label={isExpanded ? 'Collapse errors' : 'Expand errors'}
        >
          {isExpanded ? (
            <ExpandLessIcon className={styles['validation-error-icon']} />
          ) : (
            <ExpandMoreIcon className={styles['validation-error-icon']} />
          )}
        </button>
      </div>

      {isExpanded && (
        <pre className={styles['validation-error-content']}>
          {JSON.stringify(errors, null, 2)}
        </pre>
      )}
    </div>
  );
};
