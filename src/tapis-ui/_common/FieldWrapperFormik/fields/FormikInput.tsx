import React from "react";
import FieldWrapper from "../FieldWrapperFormik";
import { Input } from "reactstrap";
import { FieldInputProps } from "formik";
import { FormikInputProps } from ".";

const FormikInput: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  darkBG,
  labelClassName,
  ...props
}: FormikInputProps) => (
  <FieldWrapper
    name={name}
    label={label}
    required={required}
    description={description}
    darkBG={darkBG}
    labelClassName={labelClassName}
    isHidden={props.type && props.type === "hidden"}
    as={(formikProps: FieldInputProps<any>) => (
      <Input bsSize="sm" {...props} {...formikProps} />
    )}
  />
);

export default React.memo(FormikInput);
