import { FieldInputProps, Field, useField } from 'formik';
import { FormikInputProps } from '.';
import { Input, FormText, FormGroup, Label } from 'reactstrap';
import styles from './FormikCheck.module.scss';

const FormikCheck: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  ...props
}: FormikInputProps) => {
  // Access the field represented by the FormikCheck
  const [field] = useField(name);
  // console.log("check field: ", field.value);
  // console.log(field.name);
  return (
    <FormGroup check>
      <Label check className={`form-field__label ${styles.nospace}`} size="sm">
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
        {label}
      </Label>
      <FormText className={`form-field__help ${styles.nospace}`} color="muted">
        {description}
      </FormText>
    </FormGroup>
  );
};

export default FormikCheck;
