import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context';
import { Spinner } from '../ui/Spinner';

export const GuestRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Checking authentication...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
