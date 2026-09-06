<?php

namespace App\Services;

use App\Events\NoteUpdated;
use App\Models\Note;
use Illuminate\Support\Facades\Log;
use Throwable;

class NoteRealtimeBroadcastService
{
    /**
     * Broadcast a note update event to others on the private note channel.
     *
     * Best-effort delivery: if Reverb or the broadcast transport is unavailable,
     * the error is safely caught and logged with minimal diagnostics, ensuring
     * that the authoritative REST database mutation is never failed.
     */
    public function broadcastUpdate(Note $note, ?string $socketId = null): void
    {
        try {
            $updatedAt = $note->updated_at ? $note->updated_at->toISOString() : now()->toISOString();
            $event = new NoteUpdated($note->id, $updatedAt);

            if ($socketId !== null && trim($socketId) !== '') {
                $event->socket = trim($socketId);
            } else {
                $event->dontBroadcastToCurrentUser();
            }

            event($event);
        } catch (Throwable $e) {
            Log::warning('Note update broadcast failed', [
                'note_id' => $note->id,
                'exception' => get_class($e),
            ]);
        }
    }
}
