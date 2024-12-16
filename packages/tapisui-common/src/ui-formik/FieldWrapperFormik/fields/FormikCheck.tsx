import { FieldInputProps, Field } from 'formik';
import { FormikInputProps } from '.';
import { Input, FormText, FormGroup, Label, Tooltip } from 'reactstrap';
import { IoInformationCircleOutline } from 'react-icons/io5';
import React, { useState, useRef } from 'react';
import styles from './FormikCheck.module.scss';

const FormikCheck: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  tooltipText,
  labelClassName,
  ...props
}: FormikInputProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const iconWrapperRef = useRef<HTMLDivElement | null>(null);

  // Functions to handle hover
  const handleMouseEnter = () => {
    setTooltipOpen(true);
  };

  const handleMouseLeave = () => {
    setTooltipOpen(false);
  };

  return (
    <FormGroup check>
      <div className={styles['check-group']}>
        <Field
          name={name}
          as={(formikProps: FieldInputProps<any>) => (
            <Input
              bsSize={props['bsSize'] ?? 'sm'}
              type="checkbox"
              {...props}
              {...formikProps}
              checked={formikProps.value}
            />
          )}
        />
        <Label
          check
          className={`${labelClassName || 'form-field__label'} ${
            styles.nospace
          }`}
          size="sm"
        >
          {label}
        </Label>
        <div
          ref={iconWrapperRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <IoInformationCircleOutline className={styles['info-icon']} />
        </div>

        <Tooltip placement="top" isOpen={tooltipOpen} target={iconWrapperRef}>
          {tooltipText || 'This is the tooltip content'}
        </Tooltip>
        {description && (
          <FormText
            className={`form-field__help ${styles.nospace}`}
            color="muted"
          >
            {description}
          </FormText>
        )}
      </div>
    </FormGroup>
  );
};

export default FormikCheck;
