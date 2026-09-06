<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NoteUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public int $noteId,
        public string $updatedAt
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notes.'.$this->noteId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'note.updated';
    }

    /**
     * Get the data that should be broadcast with the event.
     *
     * NOTE: This payload intentionally acts ONLY as a minimal cache invalidation
     * signal. It MUST NOT contain title, content, passwords, hashes, labels,
     * or attachments. The client must perform an authorized REST GET request
     * to obtain the current authorized note representation.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'note_id' => $this->noteId,
            'updated_at' => $this->updatedAt,
        ];
    }
}
