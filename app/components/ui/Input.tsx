import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import type { InputVariant, InputSize } from "@/app/types";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      inputSize = "md",
      label,
      helperText,
      error,
      fullWidth = false,
      icon,
      iconPosition = "left",
      className,
      required,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-lg border bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary transition-colors focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-overlay dark:hover:bg-dark-overlay";

    const variants = {
      default: "border-border-light-default dark:border-border-dark-default focus:border-primary-500 focus:ring-primary-500",
      error: "border-error-light dark:border-error-dark focus:border-error-light focus:ring-error-light",
      success: "border-success-light dark:border-success-dark focus:border-success-light focus:ring-success-light",
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
          <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
            {label}
            {required && <span className="text-error-light dark:text-error-dark ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-tertiary dark:text-dark-tertiary">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={clsx(
              baseStyles,
              variants[actualVariant],
              sizes[inputSize],
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className
            )}
            required={required}
            {...props}
          />
          
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-tertiary dark:text-dark-tertiary">
              {icon}
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

Input.displayName = "Input";

export { Input };
