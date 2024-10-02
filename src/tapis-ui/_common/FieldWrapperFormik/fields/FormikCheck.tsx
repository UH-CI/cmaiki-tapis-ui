import { FieldInputProps, Field, useField } from "formik";
import { FormikInputProps } from ".";
import { Input, FormText, FormGroup, Label, Tooltip } from "reactstrap";
// import { FaInfoCircle } from "react-icons/fa"; // Use an info icon
import { Icon } from "tapis-ui/_common";
import React, { useState } from "react";
import styles from "./FormikCheck.module.scss";

interface FormikCheckProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  tooltipText?: string; // Add a prop for tooltip text
  labelClassName?: string;
}

const FormikCheck: React.FC<FormikInputProps> = ({
  name,
  label,
  required,
  description,
  tooltipText,
  labelClassName,
  ...props
}: FormikInputProps) => {
  const [field, meta] = useField({ name, type: "checkbox" });
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltip = () => setTooltipOpen(!tooltipOpen);

  const infoIconId = `${name}-info-icon`; // Unique ID for the tooltip

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

        {/* Info icon with tooltip */}
        {/*<FaInfoCircle id={infoIconId} className={styles["info-icon"]} />*/}
        <Icon name={"script"} />
        {tooltipText && (
          <Tooltip
            placement="top"
            isOpen={tooltipOpen}
            target={infoIconId}
            toggle={toggleTooltip}
          >
            Pineapples
            {/*{tooltipText}*/}
          </Tooltip>
        )}
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
