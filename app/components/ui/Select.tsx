import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import type { InputVariant, InputSize } from "@/app/types";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  variant?: InputVariant;
  selectSize?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  hideArrow?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = "default",
      selectSize = "md",
      label,
      helperText,
      error,
      fullWidth = false,
      options,
      placeholder,
      hideArrow = false,
      className,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-lg border bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-all duration-200 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-light-raised [&>option]:dark:bg-dark-raised [&>option]:py-2 [&>option]:px-4 [&>option:checked]:bg-primary-100 [&>option:checked]:dark:bg-primary-900 [&>option:hover]:bg-primary-50 [&>option:hover]:dark:bg-primary-950";

    const variants = {
      default: "border-border-light-default dark:border-border-dark-default focus:border-primary-500",
      error: "border-error-light dark:border-error-dark focus:border-error-light",
      success: "border-success-light dark:border-success-dark focus:border-success-light",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-5 py-3 text-lg",
    };

    const actualVariant = error ? "error" : variant;

    return (
      <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
            {label}
            {required && <span className="text-error-light dark:text-error-dark ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              baseStyles,
              variants[actualVariant],
              sizes[selectSize],
              hideArrow ? "pr-4" : "pr-10",
              className
            )}
            required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options && Array.isArray(options) ? options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            )) : children}
          </select>
          
          {/* Chevron icon */}
          {!hideArrow && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-light-tertiary dark:text-dark-tertiary">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            "text-xs",
            error 
              ? "text-error-light dark:text-error-dark" 
              : "text-text-light-tertiary dark:text-dark-tertiary"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
