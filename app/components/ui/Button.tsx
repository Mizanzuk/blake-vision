import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import type { ButtonVariant, ButtonSize } from "@/app/types";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600",
      secondary: "bg-light-overlay hover:bg-border-light-subtle active:bg-border-light-default text-text-light-primary border border-border-light-default dark:bg-dark-overlay dark:hover:bg-dark-raised dark:active:bg-border-dark-subtle dark:text-dark-primary dark:border-border-dark-default focus:ring-primary-500",
      ghost: "bg-transparent hover:bg-light-overlay active:bg-border-light-subtle text-text-light-secondary dark:hover:bg-dark-overlay dark:active:bg-dark-raised dark:text-dark-secondary focus:ring-primary-500",
      danger: "bg-error-light hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-500 dark:bg-error-dark dark:hover:bg-red-500",
      success: "bg-success-light hover:bg-primary-600 active:bg-primary-700 text-white focus:ring-primary-500 dark:bg-success-dark dark:hover:bg-primary-500",
    };

    const sizes = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
