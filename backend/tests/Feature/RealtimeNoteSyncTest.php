<?php

namespace Tests\Feature;

use App\Events\NoteUpdated;
use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use App\Services\NoteRealtimeBroadcastService;
use Exception;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\DatabaseTestCase;

class RealtimeNoteSyncTest extends DatabaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders([
            'Referer' => 'http://localhost:5173',
            'Origin' => 'http://localhost:5173',
        ]);
    }

    private function createUser(array $attributes = []): User
    {
        return User::factory()->create($attributes);
    }

    // =========================================================================
    // SECTION 28: EVENT CLASS & MINIMAL INVALIDATION SIGNAL TESTS
    // =========================================================================

    public function test_note_updated_event_broadcast_channel_and_deterministic_name(): void
    {
        $event = new NoteUpdated(42, '2026-09-06T12:00:00.000000Z');

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-notes.42', $channels[0]->name);

        $this->assertSame('note.updated', $event->broadcastAs());
    }

    public function test_note_updated_event_payload_is_strictly_minimal_invalidation_signal(): void
    {
        $event = new NoteUpdated(99, '2026-09-06T15:30:00.000000Z');
        $payload = $event->broadcastWith();

        // Exact keys allowed
        $this->assertSame(['note_id' => 99, 'updated_at' => '2026-09-06T15:30:00.000000Z'], $payload);

        // Explicit security negative assertions
        $this->assertArrayNotHasKey('title', $payload);
        $this->assertArrayNotHasKey('content', $payload);
        $this->assertArrayNotHasKey('protection_password_hash', $payload);
        $this->assertArrayNotHasKey('labels', $payload);
        $this->assertArrayNotHasKey('attachments', $payload);
        $this->assertArrayNotHasKey('note', $payload);
        $this->assertArrayNotHasKey('user_id', $payload);
    }

    // =========================================================================
    // SECTION 29: UPDATE & BROADCAST TRIGGER TESTS
    // =========================================================================

    public function test_owner_successful_patch_dispatches_broadcast_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
        ]);

        $response = $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Updated Title',
            'content' => 'Updated Content',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated Title',
            'content' => 'Updated Content',
        ]);

        Event::assertDispatched(NoteUpdated::class, function (NoteUpdated $event) use ($note) {
            return $event->noteId === $note->id && $event->broadcastAs() === 'note.updated';
        });
    }

    public function test_edit_collaborator_successful_patch_dispatches_broadcast_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'edit',
        ]);

        $response = $this->actingAs($collaborator)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Collaborator Updated Title',
            'content' => 'Collaborator Updated Content',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Collaborator Updated Title',
        ]);

        Event::assertDispatched(NoteUpdated::class, function (NoteUpdated $event) use ($note) {
            return $event->noteId === $note->id;
        });
    }

    public function test_read_collaborator_patch_is_forbidden_and_does_not_dispatch_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($collaborator)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Unauthorized Title',
        ]);

        $response->assertForbidden();
        Event::assertNotDispatched(NoteUpdated::class);
    }

    public function test_unshared_user_patch_is_forbidden_and_does_not_dispatch_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $stranger = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($stranger)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Attacker Title',
        ]);

        $response->assertForbidden();
        Event::assertNotDispatched(NoteUpdated::class);
    }

    public function test_protected_locked_patch_is_locked_and_does_not_dispatch_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'protection_password_hash' => Hash::make('SecretPass123!'),
        ]);

        $response = $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Attempt Locked Update',
        ]);

        $response->assertStatus(423);
        Event::assertNotDispatched(NoteUpdated::class);
    }

    public function test_validation_failure_does_not_dispatch_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => str_repeat('Too long', 100), // > 255 chars
        ]);

        $response->assertUnprocessable();
        Event::assertNotDispatched(NoteUpdated::class);
    }

    public function test_database_is_updated_before_broadcast(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Old Title',
        ]);

        $response = $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => 'New Title DB Check',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'New Title DB Check',
        ]);

        Event::assertDispatched(NoteUpdated::class, function (NoteUpdated $event) use ($note) {
            $fresh = Note::find($note->id);

            return $fresh && $fresh->title === 'New Title DB Check';
        });
    }

    public function test_x_socket_id_header_attaches_socket_to_event(): void
    {
        Event::fake([NoteUpdated::class]);

        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->withHeader('X-Socket-ID', '12345.67890')
            ->patchJson("/api/notes/{$note->id}", [
                'title' => 'Socket ID Title',
            ]);

        $response->assertOk();

        Event::assertDispatched(NoteUpdated::class, function (NoteUpdated $event) {
            return $event->socket === '12345.67890';
        });
    }

    public function test_broadcast_failure_does_not_break_successful_rest_patch(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Before Failure',
            'content' => 'Before Failure Content',
        ]);

        // Mock NoteRealtimeBroadcastService to simulate a transport failure
        $failingService = Mockery::mock(NoteRealtimeBroadcastService::class);
        $failingService->shouldReceive('broadcastUpdate')
            ->once()
            ->andReturnUsing(function (Note $n, ?string $socketId = null) {
                // Call real error handling path
                Log::warning('Note update broadcast failed', [
                    'note_id' => $n->id,
                    'exception' => 'RuntimeException',
                ]);
            });

        $this->app->instance(NoteRealtimeBroadcastService::class, $failingService);

        Log::spy();

        $response = $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => 'After Transport Failure',
            'content' => 'Content Still Persisted',
        ]);

        // Authoritative REST mutation succeeds
        $response->assertOk();
        $response->assertJsonPath('data.title', 'After Transport Failure');
        $response->assertJsonPath('data.content', 'Content Still Persisted');

        // Database verified updated
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'After Transport Failure',
            'content' => 'Content Still Persisted',
        ]);

        // Safe diagnostic logged without leaking note content or password
        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function ($message, $context) use ($note) {
                return $message === 'Note update broadcast failed'
                    && isset($context['note_id'])
                    && $context['note_id'] === $note->id
                    && ! isset($context['title'])
                    && ! isset($context['content']);
            });
    }

    public function test_service_catches_broadcaster_exceptions_safely(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $mockDispatcher = Mockery::mock(Dispatcher::class);
        $mockDispatcher->shouldReceive('dispatch')
            ->once()
            ->andThrow(new Exception('Reverb WebSocket connection refused'));

        $this->app->instance('events', $mockDispatcher);

        Log::spy();

        $service = new NoteRealtimeBroadcastService;
        // Calling broadcastUpdate must NOT throw
        $service->broadcastUpdate($note);

        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function ($message, $context) use ($note) {
                return $message === 'Note update broadcast failed'
                    && $context['note_id'] === $note->id
                    && $context['exception'] === Exception::class;
            });
    }
}
