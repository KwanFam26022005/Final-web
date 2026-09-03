import React, { useRef, useState } from 'react';
import { useAuth } from '../../context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { ApiError } from '../../lib/api/client';

export const ProfileSettingsPage: React.FC = () => {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();

  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const displayName = nameInput !== null ? nameInput : user?.display_name || '';
  const email = emailInput !== null ? emailInput : user?.email || '';

  const [errors, setErrors] = useState<{ displayName?: string; email?: string; general?: string }>({});
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [avatarError, setAvatarError] = useState<string>('');
  const [avatarSuccess, setAvatarSuccess] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate fallback 2-letter initials
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setErrors({});

    const newErrors: { displayName?: string; email?: string } = {};
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      const { emailChanged } = await updateProfile(displayName.trim(), email.trim());
      setProfileSuccess(
        emailChanged
          ? 'Profile updated successfully. A new verification email has been sent.'
          : 'Profile updated successfully.'
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: { displayName?: string; email?: string } = {};
          if (err.errors.display_name) fieldErrors.displayName = err.errors.display_name[0];
          if (err.errors.email) fieldErrors.email = err.errors.email[0];
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message || 'Failed to update profile.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    setAvatarSuccess('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Client-side validation: MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      setAvatarError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Client-side validation: Max 2MB (2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image size must be under 2MB.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      await uploadAvatar(file);
      setAvatarSuccess('Avatar updated successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setAvatarError(err.message || 'Failed to upload avatar.');
      } else {
        setAvatarError('Failed to upload avatar. Please try again.');
      }
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError('');
    setAvatarSuccess('');
    setIsUploadingAvatar(true);

    try {
      await removeAvatar();
      setAvatarSuccess('Avatar removed successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setAvatarError(err.message || 'Failed to remove avatar.');
      } else {
        setAvatarError('Failed to remove avatar.');
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Profile Photo
        </h2>

        {avatarSuccess && (
          <Alert variant="success" className="mb-4" data-testid="avatar-success-alert">
            {avatarSuccess}
          </Alert>
        )}

        {avatarError && (
          <Alert variant="error" className="mb-4" data-testid="avatar-error-alert">
            {avatarError}
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xl font-bold border-2 border-slate-300 dark:border-slate-600 flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-full h-full object-cover"
                data-testid="user-avatar-img"
              />
            ) : (
              <span data-testid="user-avatar-initials">{getInitials(user?.display_name || '')}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="avatar-file-input"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploadingAvatar}
                data-testid="upload-avatar-button"
              >
                Upload new photo
              </Button>

              {user?.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  data-testid="remove-avatar-button"
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Allowed formats: JPEG, PNG, WebP. Maximum file size: 2MB.
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Details Form */}
      <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Personal Information
        </h2>

        {profileSuccess && (
          <Alert variant="success" className="mb-4" data-testid="profile-success-alert">
            {profileSuccess}
          </Alert>
        )}

        {errors.general && (
          <Alert variant="error" className="mb-4">
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5" noValidate>
          <FormField
            id="profile-display-name"
            label="Display Name"
            required
            error={errors.displayName}
          >
            <Input
              type="text"
              autoComplete="name"
              value={displayName}
              disabled={isSaving}
              onChange={(e) => setNameInput(e.target.value)}
              data-testid="profile-display-name-input"
            />
          </FormField>

          <FormField
            id="profile-email"
            label="Email Address"
            required
            hint="Changing your email will require re-verifying the new address."
            error={errors.email}
          >
            <Input
              type="email"
              autoComplete="email"
              value={email}
              disabled={isSaving}
              onChange={(e) => setEmailInput(e.target.value)}
              data-testid="profile-email-input"
            />
          </FormField>

          <div className="flex items-center gap-2 -mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Email Status:</span>
            {user?.email_verified_at ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Unverified
              </span>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              data-testid="save-profile-button"
            >
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
