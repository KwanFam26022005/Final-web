import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'flat',
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white border border-slate-200 rounded-xl overflow-hidden';
  const variantStyles = {
    flat: '',
    elevated: 'shadow-sm',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
