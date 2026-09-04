import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { NotesWorkspacePage } from './pages/NotesWorkspacePage';
import { NoteEditorPage } from './pages/NoteEditorPage';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage';
import { SecuritySettingsPage } from './pages/settings/SecuritySettingsPage';
import { PreferencesSettingsPage } from './pages/settings/PreferencesSettingsPage';
import { FoundationStatus } from './components/FoundationStatus';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<NotesWorkspacePage />} />
            <Route path="/notes/new" element={<NoteEditorPage />} />
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/profile" replace />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="security" element={<SecuritySettingsPage />} />
              <Route path="preferences" element={<PreferencesSettingsPage />} />
            </Route>
          </Route>

          <Route path="/foundation" element={<FoundationStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
