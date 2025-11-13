import React from 'react';
import { Button } from '@mui/material';
import styles from '../MetadataForm.module.scss';

interface ValidationControlsProps {
  validationResult: {
    isValid: boolean;
    errorCount: number;
    errors: Record<string, string[]>;
  } | null;
  hasValidated: boolean;
  filledSampleCount: number;
  isValidating: boolean;
  isSubmitting: boolean;
  onValidate: () => void;
  onSubmit: () => void;
}

export const ValidationControls: React.FC<ValidationControlsProps> = ({
  validationResult,
  hasValidated,
  filledSampleCount,
  isValidating,
  isSubmitting,
  onValidate,
  onSubmit,
}) => {
  // Determine status message
  const getStatusMessage = () => {
    if (validationResult?.isValid) {
      return `VALIDATED: ${filledSampleCount} samples ready to export`;
    }
    if (validationResult?.isValid === false) {
      return `VALIDATION FAILED: ${validationResult.errorCount} errors found`;
    }
    if (hasValidated) {
      return `VALIDATION OUTDATED: ${filledSampleCount} samples (data changed, re-validate required)`;
    }
    return `READY TO VALIDATE: ${filledSampleCount} samples`;
  };

  // Determine status class
  const getStatusClass = () => {
    if (validationResult?.isValid) {
      return 'text-success font-weight-bold';
    }
    if (validationResult?.isValid === false) {
      return 'text-danger font-weight-bold';
    }
    return 'text-muted font-weight-bold';
  };

  // Determine helper text
  const getHelperText = () => {
    if (validationResult?.isValid) {
      return 'Only rows with data will be included in the CSV';
    }
    if (validationResult?.isValid === false) {
      return 'Fix validation errors before generating CSV';
    }
    if (hasValidated) {
      return 'Data has changed since last validation - click Validate to re-check';
    }
    return 'Click Validate to check for errors before generating CSV';
  };

  // Determine submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return 'Generating...';
    }
    if (!validationResult?.isValid) {
      if (validationResult?.isValid === false) {
        return `Fix ${validationResult.errorCount} errors first`;
      }
      return 'Validate first';
    }
    return `Generate CSV (${filledSampleCount} samples)`;
  };

  return (
    <div className={styles['submit-controls']}>
      <div>
        <div className={getStatusClass()}>{getStatusMessage()}</div>
        <small className="text-muted">{getHelperText()}</small>
      </div>

      <div className={styles['btn-group']}>
        <Button
          variant="outlined"
          color="primary"
          disabled={isValidating || filledSampleCount === 0}
          onClick={onValidate}
          className={styles['button-margin-right']}
        >
          {isValidating ? 'Validating...' : 'Validate'}
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={
            isSubmitting ||
            filledSampleCount === 0 ||
            !validationResult?.isValid
          }
          onClick={onSubmit}
        >
          {getSubmitButtonText()}
        </Button>
      </div>
    </div>
  );
};
