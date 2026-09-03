import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', isInvalid = false, type = 'text', ...props }, ref) => {
    const baseStyles =
      'block w-full rounded-md border text-sm transition-colors px-3 py-2 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

    const stateStyles = isInvalid
      ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500';

    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={isInvalid ? 'true' : undefined}
        className={`${baseStyles} ${stateStyles} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
