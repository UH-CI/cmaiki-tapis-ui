import { useMemo, useCallback, useRef } from 'react';
import * as Yup from 'yup';
import { MetadataFieldDef, SampleData, MetadataSchema } from '../metadataUtils';

interface UseValidationProps {
  setFields: MetadataFieldDef[];
  sampleFields: MetadataFieldDef[];
  samples: SampleData[];
  metadataSchema?: MetadataSchema;
}

interface ValidationResult {
  isValid: boolean;
  errorCount: number;
  errors: Record<string, string[]>;
}

// Helper function to check field conditions
const checkCondition = (
  fieldValue: any,
  operator: string,
  expectedValue: string
): boolean => {
  switch (operator) {
    case '=':
      return fieldValue === expectedValue;
    case '!=':
      return fieldValue !== expectedValue;
    case '>':
      return fieldValue > expectedValue;
    case '<':
      return fieldValue < expectedValue;
    case '>=':
      return fieldValue >= expectedValue;
    case '<=':
      return fieldValue <= expectedValue;
    default:
      return true;
  }
};

// Helper function to validate date format YYYY-MM-DD
const isValidDateFormat = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;

  // Check if value matches YYYY-MM-DD pattern exactly
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;

  // Parse the date components
  const [year, month, day] = value.split('-').map(Number);

  // Check if it's a valid date
  const date = new Date(year, month - 1, day);

  // Verify the date is valid and matches input
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    year >= 1900 && // Reasonable year range
    year <= 2100
  );
};

// Helper function to get available options for dropdown fields
const getAvailableOptions = (
  field: MetadataFieldDef,
  parentValues: any
): string[] => {
  if (field.dynamic_options) {
    const { based_on, option_map } = field.dynamic_options;
    const baseFieldValue = parentValues[based_on];
    return option_map[baseFieldValue] || [];
  } else if (field.options) {
    return field.options;
  }
  return [];
};

// Helper function to apply field-specific validation
const applyFieldValidation = (
  validator: any,
  field: MetadataFieldDef,
  parentValues: any,
  isConditional: boolean = false
): any => {
  // Date format validation
  if (field.input_type === 'date' && field.validation.format === 'YYYY-MM-DD') {
    validator = validator.test(
      'date-format',
      `${field.field_name} must be in YYYY-MM-DD format`,
      function (this: any, value: any) {
        // Allow empty values for optional fields
        if (!value || value.trim() === '') {
          return !field.required;
        }
        return isValidDateFormat(value);
      }
    );
  }

  // Dropdown validation
  if (field.input_type === 'dropdown' && field.validation.type === 'enum') {
    validator = validator.test(
      'dropdown-options',
      `${field.field_name} must be one of the allowed options`,
      function (this: any, value: any) {
        // Allow empty values for optional fields
        if (!value || value.trim() === '') {
          return !field.required;
        }

        const availableOptions = getAvailableOptions(field, this.parent);
        return availableOptions.includes(value);
      }
    );
  }

  // Date comparison validation for sample fields
  if (
    field.input_type === 'date' &&
    field.validation.custom_rules?.includes('equal_or_after_collection_date')
  ) {
    validator = validator.test(
      'date-comparison',
      `${field.field_name} must be on or after Collection Date`,
      function (this: any, value: any) {
        if (!value) {
          return true; // Allow empty end date
        }

        // Access the collection_date field from the current sample
        const parentSample = this.parent;
        const collectionDate = parentSample.collection_date;

        // If no collection date, allow any end date
        if (!collectionDate) {
          return true;
        }

        // Validate end date format
        if (!isValidDateFormat(value)) {
          return false;
        }

        const startDate = new Date(collectionDate);
        const endDate = new Date(value);
        return endDate >= startDate;
      }
    );
  }

  // Standard validation rules (only for non-conditional fields)
  if (!isConditional) {
    if (field.validation.minLength) {
      validator = validator.min(
        field.validation.minLength,
        `${field.field_name} must be at least ${field.validation.minLength} characters`
      );
    }

    if (field.validation.maxLength) {
      validator = validator.max(
        field.validation.maxLength,
        `${field.field_name} must be no more than ${field.validation.maxLength} characters`
      );
    }

    if (field.validation.pattern) {
      validator = validator.matches(
        new RegExp(field.validation.pattern),
        `${field.field_name} format is invalid`
      );
    }
  }

  return validator;
};

// Helper function to create Yup validation schema
const createMultiSampleValidationSchema = (
  setFields: MetadataFieldDef[],
  sampleFields: MetadataFieldDef[],
  schema?: MetadataSchema
) => {
  const setWideSchema: Record<string, Yup.StringSchema> = {};

  setFields.forEach((field) => {
    let validator = Yup.string();

    if (field.required) {
      validator = validator.required(`${field.field_name} is required`);
    }

    setWideSchema[field.field_id] = validator;
  });

  const sampleSchema: any = {};
  sampleFields.forEach((field) => {
    let validator: any = Yup.string();

    if (!field.required) {
      validator = validator.nullable().optional();
    }

    // Apply field-specific validation using helper function (only for non-conditional fields)
    if (!field.show_condition) {
      validator = applyFieldValidation(validator, field, {}, false);
    } else {
      // For conditional fields, create a validator that only applies validation when condition is met
      validator = validator.test(
        'conditional-field',
        `${field.field_name} is required when ${
          field.show_condition!.field
        } is ${field.show_condition!.value}`,
        function (this: any, value: any) {
          // Get the current sample data to check the condition
          const allData = this.from?.[1]?.value || {};
          const samples = allData.samples || [];

          // Find current sample index
          const currentPath = this.path;
          const currentIndex = parseInt(
            currentPath.match(/samples\[(\d+)\]/)?.[1] || '0'
          );

          const currentSample = samples[currentIndex] || {};
          const conditionFieldValue =
            currentSample[field.show_condition!.field];

          // Check if the condition is met
          const conditionMet = checkCondition(
            conditionFieldValue,
            field.show_condition!.operator,
            field.show_condition!.value
          );

          // If condition is not met, allow any value
          if (!conditionMet) {
            return true;
          }

          // If condition is met, apply validation
          // First check if field is conditionally required
          if (
            field.validation.conditional_required &&
            (!value || value.trim() === '')
          ) {
            return false;
          }

          // Apply field-specific validation
          const conditionalValidator = applyFieldValidation(
            Yup.string(),
            field,
            this.parent,
            true
          );

          try {
            conditionalValidator.validateSync(value);
            return true;
          } catch (error) {
            return false;
          }
        }
      );
    }

    // Add custom date comparison validation for sample fields (separate from conditional validation)
    if (
      field.input_type === 'date' &&
      field.validation.custom_rules?.includes('equal_or_after_collection_date')
    ) {
      validator = validator.test(
        'date-comparison',
        `${field.field_name} must be on or after Collection Date`,
        function (this: any, value: any) {
          if (!value) {
            return true; // Allow empty end date
          }

          // Access the collection_date field from the current sample
          let collectionDate;

          // Get the current path to find sample index
          const currentPath = this.path;
          const sampleIndex = parseInt(
            currentPath.match(/samples\[(\d+)\]/)?.[1] || '0'
          );

          // Try to access the parent sample object directly
          const parentSample = this.parent;
          if (parentSample && parentSample.collection_date) {
            collectionDate = parentSample.collection_date;
          } else {
            // Fallback: try to access from form data
            const allData = this.from?.[1]?.value || {};
            const samples = allData.samples || [];
            const currentSample = samples[sampleIndex] || {};
            collectionDate = currentSample.collection_date;
          }

          if (!collectionDate || !isValidDateFormat(collectionDate)) {
            return true; // If collection date is invalid, don't validate comparison
          }

          if (!isValidDateFormat(value)) {
            return false; // End date must be valid format
          }

          // Compare dates
          const startDate = new Date(collectionDate);
          const endDate = new Date(value);
          const isValid = endDate >= startDate;

          return isValid;
        }
      );
    }

    if (field.validation.unique) {
      validator = validator.test(
        'unique',
        `${field.field_name} must be unique across all samples`,
        function (this: any, value: any) {
          if (!value) return true;

          const allData = this.from?.[1]?.value || {};
          const samples = allData.samples || [];

          // Find current sample index
          const currentPath = this.path;
          const currentIndex = parseInt(
            currentPath.match(/samples\[(\d+)\]/)?.[1] || '0'
          );

          return !samples.some(
            (sample: any, index: number) =>
              index !== currentIndex && sample[field.field_id] === value
          );
        }
      );
    }

    if (field.required) {
      validator = validator.required(`${field.field_name} is required`);
    }

    sampleSchema[field.field_id] = validator;
  });

  return Yup.object({
    ...setWideSchema,
    samples: Yup.array()
      .of(Yup.object(sampleSchema))
      .min(1, 'At least one sample is required'),
  });
};

export const useValidation = ({
  setFields,
  sampleFields,
  samples,
  metadataSchema,
}: UseValidationProps) => {
  // Performance measurement - remove in production
  const hookCallCount = useRef(0);
  hookCallCount.current += 1;
  console.log('useValidation hook call count:', hookCallCount.current);
  // Create validation schema once
  const validationSchema = useMemo(() => {
    console.log('Creating validation schema...');
    return createMultiSampleValidationSchema(
      setFields,
      sampleFields,
      metadataSchema
    );
  }, [setFields, sampleFields, metadataSchema]);

  // Validate entire form using Yup schema (including sample data)
  const validateForm = useCallback(
    async (values: any): Promise<ValidationResult> => {
      console.log('validateForm called');
      try {
        // Filter to only samples with data for validation
        const samplesWithData = samples.filter((sample) =>
          Object.values(sample).some((value) => value?.trim())
        );

        // Create complete validation data including only samples with data
        const validationData = {
          ...values,
          samples: samplesWithData,
        };

        // If no samples with data, that's an error
        if (samplesWithData.length === 0) {
          return {
            isValid: false,
            errorCount: 1,
            errors: { samples: ['At least one sample with data is required'] },
          };
        }

        await validationSchema.validate(validationData, { abortEarly: false });
        return { isValid: true, errorCount: 0, errors: {} };
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors: Record<string, string[]> = {};
          error.inner.forEach((err) => {
            const field = err.path || 'unknown';
            if (!errors[field]) {
              errors[field] = [];
            }
            errors[field].push(err.message);
          });
          console.log('Form validation failed:', {
            errorCount: error.inner.length,
            errors,
            values: values,
            samples: samples.filter((s) =>
              Object.values(s).some((v) => v?.trim())
            ),
          });
          return {
            isValid: false,
            errorCount: error.inner.length,
            errors,
          };
        }
        console.log('Form validation error (non-Yup):', error);
        return {
          isValid: false,
          errorCount: 1,
          errors: { general: ['Validation error'] },
        };
      }
    },
    [validationSchema, samples]
  );

  // Validate samples specifically (for samples with data)
  const validateSamples = useCallback(
    (samplesWithData: SampleData[]): ValidationResult => {
      if (samplesWithData.length === 0) {
        return { isValid: true, errorCount: 0, errors: {} };
      }

      const sampleSchema = validationSchema.fields
        .samples as Yup.ArraySchema<any>;
      const sampleObjectSchema = (sampleSchema as any).innerType;

      let totalErrors = 0;
      const allErrors: Record<string, string[]> = {};

      samplesWithData.forEach((sample, index) => {
        try {
          sampleObjectSchema.validateSync(sample, { abortEarly: false });
          console.log(`Sample ${index} validation passed:`, sample);
        } catch (error) {
          if (error instanceof Yup.ValidationError) {
            console.log(`Sample ${index} validation failed:`, {
              sample,
              errors: error.inner.map((err) => ({
                field: err.path,
                message: err.message,
              })),
            });
            error.inner.forEach((err) => {
              const field = err.path || 'unknown';
              const errorKey = `samples[${index}].${field}`;
              if (!allErrors[errorKey]) {
                allErrors[errorKey] = [];
              }
              allErrors[errorKey].push(err.message);
              totalErrors++;
            });
          }
        }
      });

      const result = {
        isValid: totalErrors === 0,
        errorCount: totalErrors,
        errors: allErrors,
      };

      return result;
    },
    [validationSchema]
  );

  // Get validation state for UI
  const getValidationState = useCallback(
    (formErrors: Record<string, any>, samplesWithData: SampleData[]) => {
      const sampleValidation = validateSamples(samplesWithData);
      const formErrorCount = Object.keys(formErrors).filter(
        (field) => field !== 'samples'
      ).length;

      const hasFormErrors = formErrorCount > 0;
      const totalErrorCount = sampleValidation.errorCount + formErrorCount;
      const isFormValid = sampleValidation.isValid && !hasFormErrors;

      const validationState = {
        isFormValid,
        totalErrorCount,
        sampleErrorCount: sampleValidation.errorCount,
        formErrorCount,
        hasFormErrors,
        sampleValidation,
      };

      console.log('Overall validation state:', {
        isFormValid,
        totalErrorCount,
        sampleErrorCount: sampleValidation.errorCount,
        formErrorCount,
        hasFormErrors,
        formErrors,
        sampleValidationErrors: sampleValidation.errors,
      });

      return validationState;
    },
    [validateSamples]
  );

  // Field validation utilities
  const validateField = useCallback(
    (field: MetadataFieldDef, value: any, context?: any) => {
      const fieldSchema = (validationSchema.fields as any)[field.field_id];
      if (!fieldSchema) {
        console.log(`No schema found for field: ${field.field_id}`);
        return { isValid: true, error: null };
      }

      try {
        fieldSchema.validateSync(value);
        console.log(`Field validation passed: ${field.field_id} = "${value}"`);
        return { isValid: true, error: null };
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          console.log(
            `Field validation failed: ${field.field_id} = "${value}"`,
            {
              error: error.message,
              field: field.field_id,
              value,
              context,
            }
          );
          return { isValid: false, error: error.message };
        }
        console.log(
          `Field validation error (non-Yup): ${field.field_id}`,
          error
        );
        return { isValid: false, error: 'Validation error' };
      }
    },
    [validationSchema]
  );

  // Date formatting utility
  const formatDateInput = useCallback((value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as YYYY-MM-DD with validation
    if (digits.length >= 8) {
      const year = digits.slice(0, 4);
      const month = digits.slice(4, 6);
      const day = digits.slice(6, 8);

      // Basic validation for month and day ranges
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);

      if (monthNum > 12) {
        return `${year}-12-${day}`;
      }
      if (dayNum > 31) {
        return `${year}-${month}-31`;
      }

      return `${year}-${month}-${day}`;
    } else if (digits.length >= 6) {
      const year = digits.slice(0, 4);
      const month = digits.slice(4, 6);
      const day = digits.slice(6);

      // Basic validation for month range
      const monthNum = parseInt(month, 10);
      if (monthNum > 12) {
        return `${year}-12-${day}`;
      }

      return `${year}-${month}-${day}`;
    } else if (digits.length >= 4) {
      const year = digits.slice(0, 4);
      const month = digits.slice(4);

      // Basic validation for month range
      const monthNum = parseInt(month, 10);
      if (monthNum > 12) {
        return `${year}-12`;
      }

      return `${year}-${month}`;
    }
    return digits;
  }, []);

  // Memoized cache for shouldShowField results
  const shouldShowFieldCache = useRef<Map<string, boolean>>(new Map());

  // Check if field should be visible based on conditions
  const shouldShowField = useCallback(
    (field: MetadataFieldDef, formValues: { [key: string]: string }) => {
      // Create cache key from field ID and relevant form values
      const conditionField = field.show_condition?.field;
      const relevantValue = conditionField ? formValues[conditionField] : '';
      const cacheKey = `${field.field_id}:${conditionField}:${relevantValue}`;

      // Check cache first
      if (shouldShowFieldCache.current.has(cacheKey)) {
        return shouldShowFieldCache.current.get(cacheKey)!;
      }

      console.log('shouldShowField called for:', field.field_id);
      if (!field.show_condition) {
        shouldShowFieldCache.current.set(cacheKey, true);
        return true;
      }

      const {
        field: conditionFieldName,
        operator,
        value,
      } = field.show_condition;
      const fieldValue = formValues[conditionFieldName];

      let result: boolean;
      switch (operator) {
        case '=':
          result = fieldValue === value;
          break;
        case '!=':
          result = fieldValue !== value;
          break;
        case '>':
          result = fieldValue > value;
          break;
        case '<':
          result = fieldValue < value;
          break;
        case '>=':
          result = fieldValue >= value;
          break;
        case '<=':
          result = fieldValue <= value;
          break;
        default:
          result = true;
      }

      // Cache the result
      shouldShowFieldCache.current.set(cacheKey, result);
      return result;
    },
    []
  );

  // Memoized cache for getDynamicOptions results
  const getDynamicOptionsCache = useRef<Map<string, string[]>>(new Map());

  // Get dynamic options for dropdown fields
  const getDynamicOptions = useCallback(
    (field: MetadataFieldDef, formValues: { [key: string]: string }) => {
      // Create cache key from field ID and relevant form values
      const basedOnField = field.dynamic_options?.based_on;
      const relevantValue = basedOnField ? formValues[basedOnField] : '';
      const cacheKey = `${field.field_id}:${basedOnField}:${relevantValue}`;

      // Check cache first
      if (getDynamicOptionsCache.current.has(cacheKey)) {
        return getDynamicOptionsCache.current.get(cacheKey)!;
      }

      console.log('getDynamicOptions called for:', field.field_id);
      if (!field.dynamic_options) {
        const result = field.options || [];
        getDynamicOptionsCache.current.set(cacheKey, result);
        return result;
      }

      const { based_on, option_map } = field.dynamic_options;
      const baseFieldValue = formValues[based_on];

      const result = option_map[baseFieldValue] || [];
      getDynamicOptionsCache.current.set(cacheKey, result);
      return result;
    },
    []
  );

  // Clear caches when form values change significantly
  const clearCaches = useCallback(() => {
    shouldShowFieldCache.current.clear();
    getDynamicOptionsCache.current.clear();
  }, []);

  return {
    validationSchema,
    validateForm,
    validateSamples,
    getValidationState,
    validateField,
    formatDateInput,
    shouldShowField,
    getDynamicOptions,
    clearCaches,
  };
};
