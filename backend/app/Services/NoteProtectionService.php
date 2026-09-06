<?php

namespace App\Services;

use App\Models\Note;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class NoteProtectionService
{
    /**
     * Check if the note is password protected.
     */
    public function isProtected(Note $note): bool
    {
        return $note->isProtected();
    }

    /**
     * Compute the session unlock fingerprint for the note's current password hash.
     */
    public function computeFingerprint(Note $note): ?string
    {
        if (! $this->isProtected($note)) {
            return null;
        }

        return hash('sha256', (string) $note->protection_password_hash);
    }

    /**
     * Check if the note is unlocked in the given session or request.
     */
    public function isUnlocked(Session|Request $sessionOrRequest, Note $note): bool
    {
        if (! $this->isProtected($note)) {
            return true;
        }

        if ($sessionOrRequest instanceof Request) {
            if (! $sessionOrRequest->hasSession()) {
                return false;
            }
            $session = $sessionOrRequest->session();
        } else {
            $session = $sessionOrRequest;
        }

        $key = "note_unlocks.{$note->id}";
        $stored = $session->get($key);
        $expected = $this->computeFingerprint($note);

        return ! empty($stored) && hash_equals((string) $expected, (string) $stored);
    }

    /**
     * Grant session unlock access for the note.
     */
    public function grantUnlock(Session|Request $sessionOrRequest, Note $note): void
    {
        if (! $this->isProtected($note)) {
            return;
        }

        if ($sessionOrRequest instanceof Request) {
            if (! $sessionOrRequest->hasSession()) {
                return;
            }
            $session = $sessionOrRequest->session();
        } else {
            $session = $sessionOrRequest;
        }

        $key = "note_unlocks.{$note->id}";
        $fingerprint = $this->computeFingerprint($note);

        $session->put($key, $fingerprint);
    }

    /**
     * Clear session unlock access for the note.
     */
    public function clearUnlock(Session|Request $sessionOrRequest, Note $note): void
    {
        if ($sessionOrRequest instanceof Request) {
            if (! $sessionOrRequest->hasSession()) {
                return;
            }
            $session = $sessionOrRequest->session();
        } else {
            $session = $sessionOrRequest;
        }

        $key = "note_unlocks.{$note->id}";
        $session->forget($key);
    }

    /**
     * Verify a plaintext password against the note's protection password hash.
     */
    public function verifyPassword(Note $note, string $plaintext): bool
    {
        if (! $this->isProtected($note)) {
            return false;
        }

        return Hash::check($plaintext, (string) $note->protection_password_hash);
    }

    /**
     * Set or update password protection on the note and grant unlock to the current session.
     */
    public function protect(Note $note, string $plaintext, Session|Request $sessionOrRequest): void
    {
        $note->protection_password_hash = Hash::make($plaintext);
        $note->save();

        $this->grantUnlock($sessionOrRequest, $note);
    }

    /**
     * Remove password protection from the note and clear session unlock state.
     */
    public function removeProtection(Note $note, Session|Request $sessionOrRequest): void
    {
        $note->protection_password_hash = null;
        $note->save();

        $this->clearUnlock($sessionOrRequest, $note);
    }
}
