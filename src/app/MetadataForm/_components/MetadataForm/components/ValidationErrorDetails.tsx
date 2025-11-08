import React, { useState, useMemo, useEffect } from 'react';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import styles from '../MetadataForm.module.scss';

interface ValidationErrorDetailsProps {
  errors: Record<string, string[]>;
  errorCount: number;
}

interface FieldError {
  fieldName: string;
  messages: string[];
}

interface SampleGroup {
  sampleIndex: number;
  errors: FieldError[];
  errorCount: number;
}

interface GroupedErrors {
  general: string[];
  project: FieldError[];
  samples: SampleGroup[];
}

export const ValidationErrorDetails: React.FC<ValidationErrorDetailsProps> = ({
  errors,
  errorCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSamples, setExpandedSamples] = useState<Set<number>>(
    new Set()
  );

  if (errorCount === 0) {
    return null;
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const toggleSample = (sampleIndex: number) => {
    setExpandedSamples((prev) => {
      const next = new Set(prev);
      if (next.has(sampleIndex)) {
        next.delete(sampleIndex);
      } else {
        next.add(sampleIndex);
      }
      return next;
    });
  };

  // Group errors by type and sample
  const groupedErrors = useMemo(() => {
    const grouped: GroupedErrors = {
      general: [],
      project: [],
      samples: [],
    };

    // Track sample error counts
    const sampleErrorCounts = new Map<number, number>();

    Object.entries(errors).forEach(([fieldPath, messages]) => {
      // Check if it's a sample error (format: "samples[0].field_name")
      const sampleMatch = fieldPath.match(/^samples\[(\d+)\]\.(.+)$/);

      if (sampleMatch) {
        const sampleIndex = parseInt(sampleMatch[1], 10);
        const fieldName = sampleMatch[2];

        // Update error count for this sample
        const currentCount = sampleErrorCounts.get(sampleIndex) || 0;
        sampleErrorCounts.set(sampleIndex, currentCount + messages.length);

        // Find or create sample group
        let sampleGroup = grouped.samples.find(
          (s) => s.sampleIndex === sampleIndex
        );
        if (!sampleGroup) {
          sampleGroup = { sampleIndex, errors: [], errorCount: 0 };
          grouped.samples.push(sampleGroup);
        }

        sampleGroup.errors.push({
          fieldName,
          messages,
        });
        sampleGroup.errorCount = sampleErrorCounts.get(sampleIndex) || 0;
      } else if (fieldPath === 'samples') {
        // General sample errors
        grouped.general.push(...messages);
      } else {
        // Project-level errors
        grouped.project.push({
          fieldName: fieldPath,
          messages,
        });
      }
    });

    // Sort samples by index
    grouped.samples.sort((a, b) => a.sampleIndex - b.sampleIndex);

    // Sort project fields alphabetically
    grouped.project.sort((a, b) => a.fieldName.localeCompare(b.fieldName));

    // Sort fields within each sample alphabetically
    grouped.samples.forEach((sample) => {
      sample.errors.sort((a, b) => a.fieldName.localeCompare(b.fieldName));
    });

    return grouped;
  }, [errors]);

  // Expand all samples by default if there are fewer than 10 samples with errors
  useEffect(() => {
    if (
      groupedErrors.samples.length > 0 &&
      groupedErrors.samples.length <= 10
    ) {
      setExpandedSamples(
        new Set(groupedErrors.samples.map((s) => s.sampleIndex))
      );
    }
  }, [groupedErrors.samples]);

  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    // Convert snake_case to Title Case
    return fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasGeneralErrors = groupedErrors.general.length > 0;
  const hasProjectErrors = groupedErrors.project.length > 0;
  const hasSampleErrors = groupedErrors.samples.length > 0;

  return (
    <div className={styles['validation-error-container']}>
      <div
        className={styles['validation-error-header']}
        onClick={toggleExpanded}
      >
        <span className={styles['validation-error-title']}>
          <ErrorIcon className={styles['validation-error-icon']} />
          {errorCount} Validation Error{errorCount !== 1 ? 's' : ''}
          {hasSampleErrors && (
            <span className={styles['validation-error-subtitle']}>
              {' '}
              ({groupedErrors.samples.length} sample
              {groupedErrors.samples.length !== 1 ? 's' : ''} with errors)
            </span>
          )}
        </span>
        <button
          className={styles['validation-error-toggle']}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
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
        <div className={styles['validation-error-content']}>
          {/* General errors */}
          {hasGeneralErrors && (
            <div className={styles['validation-error-section']}>
              <div className={styles['validation-error-section-header']}>
                General Errors
              </div>
              <ul className={styles['validation-error-messages']}>
                {groupedErrors.general.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Project-level errors */}
          {hasProjectErrors && (
            <div className={styles['validation-error-section']}>
              <div className={styles['validation-error-section-header']}>
                Project Information Errors ({groupedErrors.project.length}{' '}
                {groupedErrors.project.length === 1 ? 'field' : 'fields'})
              </div>
              {groupedErrors.project.map((error, index) => (
                <div key={index} className={styles['validation-error-item']}>
                  <div className={styles['validation-error-field']}>
                    <span className={styles['validation-error-field-name']}>
                      {formatFieldName(error.fieldName)}
                    </span>
                  </div>
                  <ul className={styles['validation-error-messages']}>
                    {error.messages.map((message, msgIndex) => (
                      <li key={msgIndex}>{message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Sample errors grouped by sample */}
          {hasSampleErrors && (
            <div className={styles['validation-error-section']}>
              <div className={styles['validation-error-section-header']}>
                Sample Errors ({groupedErrors.samples.length}{' '}
                {groupedErrors.samples.length === 1 ? 'sample' : 'samples'})
              </div>
              {groupedErrors.samples.map((sample) => {
                const isExpanded = expandedSamples.has(sample.sampleIndex);
                return (
                  <div
                    key={sample.sampleIndex}
                    className={styles['validation-error-sample-group']}
                  >
                    <div
                      className={styles['validation-error-sample-header']}
                      onClick={() => toggleSample(sample.sampleIndex)}
                    >
                      <button
                        className={styles['validation-error-sample-toggle']}
                        aria-label={
                          isExpanded
                            ? 'Collapse sample errors'
                            : 'Expand sample errors'
                        }
                      >
                        {isExpanded ? (
                          <ExpandLessIcon
                            className={styles['validation-error-icon']}
                          />
                        ) : (
                          <ExpandMoreIcon
                            className={styles['validation-error-icon']}
                          />
                        )}
                      </button>
                      <span className={styles['validation-error-sample-label']}>
                        Sample {sample.sampleIndex + 1}
                      </span>
                      <span className={styles['validation-error-sample-count']}>
                        {sample.errorCount} error
                        {sample.errorCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isExpanded && (
                      <div
                        className={styles['validation-error-sample-content']}
                      >
                        {sample.errors.map((error, index) => (
                          <div
                            key={index}
                            className={styles['validation-error-item']}
                          >
                            <div className={styles['validation-error-field']}>
                              <span
                                className={
                                  styles['validation-error-field-name']
                                }
                              >
                                {formatFieldName(error.fieldName)}
                              </span>
                            </div>
                            <ul className={styles['validation-error-messages']}>
                              {error.messages.map((message, msgIndex) => (
                                <li key={msgIndex}>{message}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
