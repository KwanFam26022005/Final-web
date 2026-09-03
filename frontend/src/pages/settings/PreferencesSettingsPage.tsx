import React, { useState } from 'react';
import { useAuth } from '../../context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ApiError } from '../../lib/api/client';

export const PreferencesSettingsPage: React.FC = () => {
  const { preference, updatePreference } = useAuth();

  const [themeInput, setThemeInput] = useState<'system' | 'light' | 'dark' | null>(null);
  const [viewInput, setViewInput] = useState<'grid' | 'list' | null>(null);

  const theme = themeInput !== null ? themeInput : preference?.theme || 'system';
  const defaultNoteView = viewInput !== null ? viewInput : preference?.default_note_view || 'grid';

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      await updatePreference(theme, defaultNoteView);
      setSuccessMessage('Preferences saved successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Failed to save preferences.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert variant="success" className="mb-4" data-testid="preferences-success-alert">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" className="mb-4" data-testid="preferences-error-alert">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance / Theme */}
        <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Customize how Final-web looks on your device.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Theme Selection">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <label
                key={t}
                className={`flex flex-col items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === t
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
                data-testid={`theme-option-${t}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => setThemeInput(t)}
                  className="sr-only"
                />
                <span className="capitalize text-sm font-medium">{t}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  {t === 'system'
                    ? 'Follow operating system setting'
                    : t === 'light'
                    ? 'Clean light palette'
                    : 'Relaxed dark palette'}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Note Workspace Defaults */}
        <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Default Note Layout
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Choose your preferred initial note layout for the workspace.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Default Note View">
            {(['grid', 'list'] as const).map((v) => (
              <label
                key={v}
                className={`flex flex-col items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  defaultNoteView === v
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
                data-testid={`view-option-${v}`}
              >
                <input
                  type="radio"
                  name="defaultNoteView"
                  value={v}
                  checked={defaultNoteView === v}
                  onChange={() => setViewInput(v)}
                  className="sr-only"
                />
                <span className="capitalize text-sm font-medium">{v} View</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  {v === 'grid' ? 'Masonry-style note cards' : 'Compact linear note list'}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            data-testid="save-preferences-button"
          >
            Save preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
