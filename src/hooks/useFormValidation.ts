import { useState, useCallback } from "react";
import { IdeaSchema, validateInput, sanitizeString } from "@/lib/validation";

interface ValidationResult {
  isValid: boolean;
  error: string | null;
  sanitizedValue: string;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateIdea = useCallback((idea: string): ValidationResult => {
    if (!idea || typeof idea !== "string") {
      return {
        isValid: false,
        error: "アイデアを入力してください",
        sanitizedValue: "",
      };
    }

    const validation = validateInput(IdeaSchema, idea);
    const sanitizedValue = sanitizeString(idea);

    if (!validation.success) {
      return {
        isValid: false,
        error: validation.error,
        sanitizedValue,
      };
    }

    return {
      isValid: true,
      error: null,
      sanitizedValue,
    };
  }, []);

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback(
    (field: string, value: string) => {
      setIsValidating(true);

      try {
        let result: ValidationResult;

        switch (field) {
          case "idea":
            result = validateIdea(value);
            break;
          default:
            result = {
              isValid: true,
              error: null,
              sanitizedValue: sanitizeString(value),
            };
        }

        setFieldError(field, result.error);
        return result;
      } finally {
        setIsValidating(false);
      }
    },
    [validateIdea, setFieldError],
  );

  return {
    errors,
    isValidating,
    validateField,
    setFieldError,
    clearErrors,
    validateIdea,
  };
};
