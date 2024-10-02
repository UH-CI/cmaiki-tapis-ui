import { useField } from "formik";
import { FormikInputProps } from ".";
import { Input, FormText, FormGroup, Label, Tooltip } from "reactstrap";
import { IoInformationCircleOutline } from "react-icons/io5";
import React, { useState, useRef } from "react";
import styles from "./FormikCheck.module.scss";

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
  const iconWrapperRef = useRef<HTMLDivElement>(null);

  // Functions to handle hover
  const handleMouseEnter = () => {
    console.log("Mouse entered, tooltip should open");
    setTooltipOpen(true);
  };

  const handleMouseLeave = () => {
    console.log("Mouse left, tooltip should close");
    setTooltipOpen(false);
  };

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

        <div
          ref={iconWrapperRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <IoInformationCircleOutline className={styles["info-icon"]} />
        </div>

        <Tooltip placement="top" isOpen={tooltipOpen} target={iconWrapperRef}>
          {tooltipText || "This is the tooltip content"}
        </Tooltip>
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
