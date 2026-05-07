import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpIcon } from './help-system';

// Validation Rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  currency?: boolean;
  strongPassword?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Nigerian-specific validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+234|0)[789][01]\d{8}$/,
  currency: /^\d+(\.\d{2})?$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  bvn: /^\d{11}$/,
  nin: /^\d{11}$/,
  accountNumber: /^\d{10}$/,
};

// Validation Functions
export const validateField = (value: any, rules: ValidationRule): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push('This field is required');
    return { isValid: false, errors, warnings };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return { isValid: true, errors, warnings };
  }

  const stringValue = value.toString();

  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters long`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters long`);
  }

  // Email validation
  if (rules.email && !PATTERNS.email.test(stringValue)) {
    errors.push('Please enter a valid email address');
  }

  // Nigerian phone number validation
  if (rules.phone && !PATTERNS.phone.test(stringValue)) {
    errors.push('Please enter a valid Nigerian phone number (e.g., +2348012345678 or 08012345678)');
  }

  // Currency validation
  if (rules.currency && !PATTERNS.currency.test(stringValue)) {
    errors.push('Please enter a valid amount (e.g., 1000 or 1000.50)');
  }

  // Strong password validation
  if (rules.strongPassword) {
    if (!PATTERNS.strongPassword.test(stringValue)) {
      errors.push(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      );
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push('Please enter a valid format');
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Enhanced Input Component
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  rules?: ValidationRule;
  showValidation?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    { label, helpText, rules = {}, showValidation = true, onValidationChange, className, ...props },
    ref
  ) => {
    const [value, setValue] = React.useState(props.defaultValue || '');
    const [validation, setValidation] = React.useState<ValidationResult>({
      isValid: true,
      errors: [],
      warnings: [],
    });
    const [touched, setTouched] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const isPasswordField = props.type === 'password';

    React.useEffect(() => {
      if (touched || value) {
        const result = validateField(value, rules);
        setValidation(result);
        onValidationChange?.(result);
      }
    }, [value, rules, touched, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      props.onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      props.onBlur?.(e);
    };

    const getValidationIcon = () => {
      if (!showValidation || !touched) return null;

      if (validation.isValid && value) {
        return <Check className="h-4 w-4 text-primary" />;
      } else if (!validation.isValid) {
        return <X className="h-4 w-4 text-destructive" />;
      }
      return null;
    };

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">
              {label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </label>
            {helpText && <HelpIcon content={helpText} />}
          </div>
        )}

        <div className="relative">
          <Input
            ref={ref}
            {...props}
            type={isPasswordField && showPassword ? 'text' : props.type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'pr-10',
              !validation.isValid &&
                touched &&
                'border-destructive focus-visible:ring-destructive/30',
              validation.isValid &&
                touched &&
                value &&
                'border-primary focus-visible:ring-primary/30',
              className
            )}
          />

          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
            {isPasswordField && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
            {getValidationIcon()}
          </div>
        </div>

        {/* Password Strength Indicator */}
        {isPasswordField && rules.strongPassword && value && (
          <PasswordStrengthIndicator password={value} />
        )}

        {/* Validation Messages */}
        {showValidation && touched && (
          <>
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-muted-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{warning}</span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Enhanced Textarea Component
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  rules?: ValidationRule;
  showValidation?: boolean;
  showCharCount?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  (
    {
      label,
      helpText,
      rules = {},
      showValidation = true,
      showCharCount = false,
      onValidationChange,
      className,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(props.defaultValue || '');
    const [validation, setValidation] = React.useState<ValidationResult>({
      isValid: true,
      errors: [],
      warnings: [],
    });
    const [touched, setTouched] = React.useState(false);

    React.useEffect(() => {
      if (touched || value) {
        const result = validateField(value, rules);
        setValidation(result);
        onValidationChange?.(result);
      }
    }, [value, rules, touched, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      props.onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setTouched(true);
      props.onBlur?.(e);
    };

    const charCount = value.toString().length;
    const maxChars = rules.maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">
              {label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </label>
            {helpText && <HelpIcon content={helpText} />}
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={ref}
            {...props}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              !validation.isValid &&
                touched &&
                'border-destructive focus-visible:ring-destructive/30',
              validation.isValid &&
                touched &&
                value &&
                'border-primary focus-visible:ring-primary/30',
              className
            )}
          />

          {showCharCount && maxChars && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {charCount}/{maxChars}
            </div>
          )}
        </div>

        {/* Validation Messages */}
        {showValidation && touched && (
          <>
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-muted-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                <span>{warning}</span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

// Password Strength Indicator
interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    const checks = [
      { test: /.{8,}/, label: 'At least 8 characters' },
      { test: /[a-z]/, label: 'Lowercase letter' },
      { test: /[A-Z]/, label: 'Uppercase letter' },
      { test: /\d/, label: 'Number' },
      { test: /[@$!%*?&]/, label: 'Special character' },
    ];

    const passed = checks.map((check) => ({
      ...check,
      passed: check.test.test(pwd),
    }));

    score = passed.filter((check) => check.passed).length;

    return { score, checks: passed };
  };

  const { score, checks } = getStrength(password);

  const getStrengthLabel = (score: number) => {
    if (score < 2) return { label: 'Weak', color: 'text-destructive' };
    if (score < 4) return { label: 'Fair', color: 'text-muted-foreground' };
    if (score < 5) return { label: 'Good', color: 'text-primary' };
    return { label: 'Strong', color: 'text-primary' };
  };

  const strength = getStrengthLabel(score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn('text-sm font-medium', strength.color)}>{strength.label}</span>
      </div>

      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              i <= score
                ? score < 2
                  ? 'bg-destructive'
                  : score < 4
                    ? 'bg-muted-foreground/60'
                    : score < 5
                      ? 'bg-primary/70'
                      : 'bg-primary'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            {check.passed ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={check.passed ? 'text-primary' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form Validation Hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, ValidationRule>
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<keyof T, string[]>>(
    {} as Record<keyof T, string[]>
  );
  const [touched, setTouchedState] = React.useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  );

  const validateFieldValue = React.useCallback(
    (name: keyof T, value: any) => {
      const rules = validationRules[name];
      if (!rules) return { isValid: true, errors: [], warnings: [] };

      return validateField(value, rules);
    },
    [validationRules]
  );

  const validateForm = React.useCallback(() => {
    const newErrors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const result = validateFieldValue(fieldName, values[fieldName]);
      if (!result.isValid) {
        newErrors[fieldName] = result.errors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateFieldValue]);

  const setValue = React.useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate field if it's been touched
      if (touched[name]) {
        const result = validateFieldValue(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: result.errors,
        }));
      }
    },
    [touched, validateFieldValue]
  );

  const setTouched = React.useCallback(
    (name: keyof T, isTouched = true) => {
      setTouchedState((prev) => ({ ...prev, [name]: isTouched }));

      if (isTouched) {
        const result = validateFieldValue(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: result.errors,
        }));
      }
    },
    [values, validateFieldValue]
  );

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string[]>);
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const isValid = Object.keys(errors).every(
    (key) => !errors[key as keyof T] || errors[key as keyof T].length === 0
  );

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateForm,
    reset,
  };
};

// Nigerian-specific validation helpers
export const nigerianValidators = {
  bvn: (value: string) => (PATTERNS.bvn.test(value) ? null : 'Please enter a valid 11-digit BVN'),

  nin: (value: string) => (PATTERNS.nin.test(value) ? null : 'Please enter a valid 11-digit NIN'),

  accountNumber: (value: string) =>
    PATTERNS.accountNumber.test(value) ? null : 'Please enter a valid 10-digit account number',

  nairaAmount: (value: string) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      return 'Please enter a valid amount in Naira';
    }
    if (amount > 10000000) {
      return 'Amount cannot exceed ₦10,000,000';
    }
    return null;
  },

  lagosAddress: (value: string) => {
    const lagosAreas = [
      'lekki',
      'victoria island',
      'ikoyi',
      'surulere',
      'yaba',
      'ikeja',
      'gbagada',
    ];
    const hasLagosArea = lagosAreas.some((area) => value.toLowerCase().includes(area));
    return hasLagosArea ? null : 'Please specify a valid Lagos area';
  },
};
