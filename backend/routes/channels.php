<?php

use App\Models\Note;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, int|string $id): bool {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('notes.{noteId}', function (User $user, int|string $noteId): bool {
    $note = Note::find($noteId);

    if (! $note) {
        return false;
    }

    return $user->can('view', $note);
});
