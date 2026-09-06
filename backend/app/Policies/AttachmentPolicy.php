<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\Note;
use App\Models\User;

class AttachmentPolicy
{
    /**
     * Determine whether the user can list attachments for the note.
     */
    public function viewAny(User $user, Note $note): bool
    {
        return $user->can('view', $note);
    }

    /**
     * Determine whether the user can upload an attachment to the note.
     */
    public function create(User $user, Note $note): bool
    {
        return $user->can('editContent', $note);
    }

    /**
     * Determine whether the user can view or stream the attachment.
     */
    public function view(User $user, Attachment $attachment): bool
    {
        return $user->can('view', $attachment->note);
    }

    /**
     * Determine whether the user can download the attachment.
     */
    public function download(User $user, Attachment $attachment): bool
    {
        return $user->can('view', $attachment->note);
    }

    /**
     * Determine whether the user can delete the attachment.
     */
    public function delete(User $user, Attachment $attachment): bool
    {
        return $user->can('editContent', $attachment->note);
    }
}
