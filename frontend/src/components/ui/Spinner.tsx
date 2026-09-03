import React from 'react';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', ...props }) => {
  return (
    <svg
      className={`animate-spin text-current ${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
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
        d="M4 12a8 8 0 018-8v8H4z"
      />
      <span className="sr-only">Loading...</span>
    </svg>
  );
};
