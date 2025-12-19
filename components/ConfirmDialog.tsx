import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-error-light hover:bg-error-light/90 dark:bg-error-dark dark:hover:bg-error-dark/90',
    warning: 'bg-warning-light hover:bg-warning-light/90 dark:bg-warning-dark dark:hover:bg-warning-dark/90',
    info: 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
  };

  // Handle ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onCancel]);

  // Handle Enter key
  React.useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEnter);
      return () => document.removeEventListener('keydown', handleEnter);
    }
  }, [isOpen, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-light-raised dark:bg-dark-raised rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border border-border-light-default dark:border-border-dark-default">
        {/* Title */}
        <h3 className="text-xl font-bold mb-2 text-text-light-primary dark:text-dark-primary">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-text-light-secondary dark:text-dark-secondary mb-6">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-border-light-default dark:border-border-dark-default rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors font-medium text-text-light-primary dark:text-dark-primary"
            autoFocus
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm text-white rounded-lg transition-colors font-medium ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
