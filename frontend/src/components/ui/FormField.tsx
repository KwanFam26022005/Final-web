import React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      </div>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; isInvalid?: boolean }>, {
              id,
              isInvalid: Boolean(error),
              'aria-describedby': error ? errorId : hint ? hintId : undefined,
            })
          : children}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 flex items-center gap-1 mt-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
