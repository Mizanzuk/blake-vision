import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import type { InputVariant } from "@/app/types";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = "default",
      label,
      helperText,
      error,
      fullWidth = false,
      resize = "vertical",
      className,
      required,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-lg border bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans leading-relaxed";

    const variants = {
      default: "border-border-light-default dark:border-border-dark-default focus:border-primary-500 focus:ring-primary-500",
      error: "border-error-light dark:border-error-dark focus:border-error-light focus:ring-error-light",
      success: "border-success-light dark:border-success-dark focus:border-success-light focus:ring-success-light",
    };

    const resizeStyles = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
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
        
        <textarea
          ref={ref}
          className={clsx(
            baseStyles,
            variants[actualVariant],
            resizeStyles[resize],
            "px-4 py-3 text-base min-h-[120px]",
            className
          )}
          required={required}
          {...props}
        />
        
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

Textarea.displayName = "Textarea";

export { Textarea };
