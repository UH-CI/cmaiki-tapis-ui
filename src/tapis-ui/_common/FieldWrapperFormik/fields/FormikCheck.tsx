import { FieldInputProps, Field, useField } from "formik";
import { FormikInputProps } from ".";
import { Input, FormText, FormGroup, Label } from "reactstrap";
import styles from "./FormikCheck.module.scss";

const FormikCheck: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  labelClassName,
  ...props
}: FormikInputProps) => {
  // Access the field represented by the FormikCheck
  const [field] = useField(name);
  return (
    <FormGroup check>
      <div className={styles["check-group"]}>
        <Field
          name={name}
          as={(formikProps: FieldInputProps<any>) => (
            <Input
              bsSize={props["bsSize"] ?? "sm"}
              type="checkbox"
              {...props}
              {...formikProps}
              checked={field.value}
              // checked={formikProps.value}
            />
          )}
        />
        <Label
          check
          className={`${
            labelClassName ? labelClassName : "form-field__label"
          } ${styles.nospace}`}
          size="sm"
        >
          {label}
        </Label>
      </div>
      <FormText className={`form-field__help ${styles.nospace}`} color="muted">
        {description}
      </FormText>
    </FormGroup>
  );
};

export default FormikCheck;
