import { FieldInputProps, Field, useField } from "formik";
import { FormikInputProps } from ".";
import { Input, FormText, FormGroup, Label } from "reactstrap";
import styles from "./FormikCheck.module.scss";
import { useEffect } from "react";

const FormikCheck: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  labelClassName,
  ...props
}: FormikInputProps) => {
  const [field, meta] = useField({ name, type: "checkbox" });

  // useEffect(() => {
  //   console.log(`Checkbox '${name}' state:`, field.value);
  // }, [field.value, name]);

  return (
    <FormGroup check>
      <div className={styles["check-group"]}>
        <Input
          {...field}
          bsSize={props["bsSize"] ?? "sm"}
          type="checkbox"
          {...props}
        />
        <Label
          check
          className={`${labelClassName || "form-field__label"} ${
            styles.nospace
          }`}
          size="sm"
        >
          {label}
        </Label>
      </div>
      {description && (
        <FormText
          className={`form-field__help ${styles.nospace}`}
          color="muted"
        >
          {description}
        </FormText>
      )}
      {meta.touched && meta.error && <div className="error">{meta.error}</div>}
    </FormGroup>
  );
};

export default FormikCheck;
