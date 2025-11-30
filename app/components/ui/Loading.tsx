import { clsx } from "clsx";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  size = "md",
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <svg
      className={clsx("animate-spin", sizes[size])}
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
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-light-base/80 dark:bg-dark-base/80 backdrop-blur-sm">
        <div className="text-primary-600 dark:text-primary-400">
          {spinner}
        </div>
        {text && (
          <p className="mt-4 text-sm text-text-light-secondary dark:text-dark-secondary">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col items-center justify-center", className)}>
      <div className="text-primary-600 dark:text-primary-400">
        {spinner}
      </div>
      {text && (
        <p className="mt-2 text-sm text-text-light-secondary dark:text-dark-secondary">
          {text}
        </p>
      )}
    </div>
  );
}
