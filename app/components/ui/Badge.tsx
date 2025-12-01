import { HTMLAttributes } from "react";
import { clsx } from "clsx";
import type { BadgeVariant, BadgeSize } from "@/app/types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 font-medium rounded-full transition-colors";

  const variants = {
    default: "bg-light-overlay text-text-light-secondary border border-border-light-default dark:bg-dark-overlay dark:text-dark-secondary dark:border-border-dark-default",
    primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    urizen: "bg-[#5B7C8D]/15 text-[#5B7C8D] dark:bg-[#5B7C8D]/25 dark:text-[#7B9CAD]",
    urthona: "bg-[#C85A54]/15 text-[#C85A54] dark:bg-[#C85A54]/25 dark:text-[#D87A74]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const dotColors = {
    default: "bg-text-light-tertiary dark:bg-text-dark-tertiary",
    primary: "bg-primary-600 dark:bg-primary-400",
    success: "bg-emerald-600 dark:bg-emerald-400",
    warning: "bg-amber-600 dark:bg-amber-400",
    error: "bg-red-600 dark:bg-red-400",
    urizen: "bg-[#5B7C8D] dark:bg-[#7B9CAD]",
    urthona: "bg-[#C85A54] dark:bg-[#D87A74]",
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
