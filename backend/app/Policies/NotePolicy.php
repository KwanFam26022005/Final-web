<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;

class NotePolicy
{
    /**
     * Determine whether the user can view the note.
     */
    public function view(User $user, Note $note): bool
    {
        if ($user->id === $note->user_id) {
            return true;
        }

        return $note->shares()->where('shared_with_user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can edit the note title and content.
     */
    public function editContent(User $user, Note $note): bool
    {
        if ($user->id === $note->user_id) {
            return true;
        }

        return $note->shares()
            ->where('shared_with_user_id', $user->id)
            ->where('permission', 'edit')
            ->exists();
    }

    /**
     * Generic update capability alias matching editContent.
     */
    public function update(User $user, Note $note): bool
    {
        return $this->editContent($user, $note);
    }

    /**
     * Determine whether the user can delete the note (owner-only).
     */
    public function delete(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    /**
     * Determine whether the user can pin or unpin the note (owner-only).
     */
    public function pin(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    /**
     * Determine whether the user can manage labels on the note (owner-only).
     */
    public function manageLabels(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    /**
     * Determine whether the user can manage password protection on the note (owner-only).
     */
    public function manageProtection(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }

    /**
     * Determine whether the user can manage sharing on the note (owner-only).
     */
    public function manageShares(User $user, Note $note): bool
    {
        return $user->id === $note->user_id;
    }
}
