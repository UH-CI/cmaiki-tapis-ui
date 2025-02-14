import React, { useState } from 'react';
import { FormGroup, Label, Badge, FormText } from 'reactstrap';
import { Drawer, Box, IconButton } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';

import styles from './FieldWrapperFormik.module.css';
import { Field, useField } from 'formik';
export type FieldWrapperProps = {
  name: string;
  label: string;
  required: boolean;
  description: string;
  isHidden?: boolean;
  as: React.ComponentType<any>;
  labelClassName?: string;
  infoText?: string;
};
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  name,
  label,
  required,
  description,
  isHidden = false,
  as: Component,
  labelClassName,
  infoText,
}) => {
  const [, meta] = useField(name);
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <FormGroup>
      <span className={isHidden ? styles['hidden'] : ''}>
        <Label
          className={`${labelClassName || 'form-field__label'} ${
            styles.nospace
          }`}
          size="sm"
          style={{ display: 'flex', alignItems: 'center' }}
          htmlFor={name}
        >
          {label}
          {required && !isHidden ? (
            <Badge color="danger" style={{ marginLeft: '10px' }}>
              Required
            </Badge>
          ) : null}
          {infoText && (
            <>
              <IconButton onClick={toggleDrawer} color="info">
                <ArticleIcon
                  sx={{ fontSize: '1.25rem', paddingLeft: '0.25rem' }}
                />
              </IconButton>
              <Drawer
                anchor="right"
                open={open}
                onClose={toggleDrawer}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: '35vw',
                  },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    padding: '1em',
                    wordWrap: 'normal',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}
                  role="presentation"
                >
                  <p>{infoText}</p>
                </Box>
              </Drawer>
            </>
          )}
        </Label>
        <Field name={name} as={Component} id={name} />
        {meta.error && (
          <FormText className={styles['form-field__help']} color="danger">
            {meta.error}
          </FormText>
        )}
        {description && !meta.error && (
          <FormText className={styles['form-field__help']} color="muted">
            {description}
          </FormText>
        )}
      </span>
    </FormGroup>
  );
};

export default FieldWrapper;
