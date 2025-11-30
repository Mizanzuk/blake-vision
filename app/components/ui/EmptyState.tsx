import { ReactNode } from "react";
import { clsx } from "clsx";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text-light-tertiary dark:text-dark-tertiary opacity-50">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  );
}
