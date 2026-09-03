import React, { useState } from 'react';
import { useAuth } from '../../context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { ApiError } from '../../lib/api/client';

export const SecuritySettingsPage: React.FC = () => {
  const { updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; newPasswordConfirmation?: string; general?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    const newErrors: { currentPassword?: string; newPassword?: string; newPasswordConfirmation?: string } = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!newPasswordConfirmation) {
      newErrors.newPasswordConfirmation = 'Please confirm your new password';
    } else if (newPassword !== newPasswordConfirmation) {
      newErrors.newPasswordConfirmation = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);

    try {
      await updatePassword(currentPassword, newPassword, newPasswordConfirmation);
      setSuccessMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: { currentPassword?: string; newPassword?: string; newPasswordConfirmation?: string; general?: string } = {};
          if (err.errors.current_password) fieldErrors.currentPassword = err.errors.current_password[0];
          if (err.errors.new_password) fieldErrors.newPassword = err.errors.new_password[0];
          if (err.errors.new_password_confirmation) fieldErrors.newPasswordConfirmation = err.errors.new_password_confirmation[0];
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message || 'Failed to update password.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert variant="success" className="mb-4" data-testid="security-success-alert">
          {successMessage}
        </Alert>
      )}

      {errors.general && (
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField
            id="current-password"
            label="Current Password"
            required
            error={errors.currentPassword}
          >
            <PasswordInput
              autoComplete="current-password"
              placeholder="Enter your current password"
              value={currentPassword}
              disabled={isUpdating}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="current-password-input"
            />
          </FormField>

          <FormField
            id="new-password"
            label="New Password"
            required
            hint="Minimum 8 characters"
            error={errors.newPassword}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Enter your new password"
              value={newPassword}
              disabled={isUpdating}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="new-password-input"
            />
          </FormField>

          <FormField
            id="confirm-new-password"
            label="Confirm New Password"
            required
            error={errors.newPasswordConfirmation}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Confirm your new password"
              value={newPasswordConfirmation}
              disabled={isUpdating}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              data-testid="confirm-new-password-input"
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdating}
              data-testid="update-password-button"
            >
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
