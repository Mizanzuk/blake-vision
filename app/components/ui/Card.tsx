import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  children: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  hoverable = false,
  className,
  children,
  ...props
}: CardProps) {
  const baseStyles = "rounded-xl transition-all duration-200";

  const variants = {
    default: "bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default",
    elevated: "bg-light-raised dark:bg-dark-raised shadow-soft-lg",
    outlined: "bg-transparent border-2 border-border-light-default dark:border-border-dark-default",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        hoverable && "hover:shadow-soft-xl hover:scale-[1.02] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={clsx("flex items-start justify-between mb-4", className)}>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-text-light-tertiary dark:text-dark-tertiary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={clsx(
        "mt-6 pt-4 border-t border-border-light-default dark:border-border-dark-default",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
