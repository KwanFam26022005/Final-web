<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class RealtimeChannelAuthTest extends DatabaseTestCase
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
    // ANONYMOUS & AUTHENTICATION
    // =========================================================================

    public function test_anonymous_user_cannot_authorize_note_channel(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertUnauthorized();
    }

    // =========================================================================
    // AUTHORIZED ACTORS (OWNER, READ, EDIT)
    // =========================================================================

    public function test_owner_can_authorize_own_note_channel(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Owner Private Note',
            'content' => 'Top secret content',
        ]);

        $response = $this->actingAs($owner)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['auth']);
        $this->assertNotEmpty($response->json('auth'));
    }

    public function test_read_collaborator_can_authorize_note_channel(): void
    {
        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($collaborator)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['auth']);
    }

    public function test_edit_collaborator_can_authorize_note_channel(): void
    {
        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'edit',
        ]);

        $response = $this->actingAs($collaborator)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['auth']);
    }

    // =========================================================================
    // DENIALS (UNSHARED, REVOKED, NONEXISTENT)
    // =========================================================================

    public function test_unshared_authenticated_user_denied_channel_authorization(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($stranger)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertForbidden();
    }

    public function test_revoked_collaborator_denied_channel_authorization(): void
    {
        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'read',
        ]);

        // Revoke the share
        $share->delete();

        $response = $this->actingAs($collaborator)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertForbidden();
    }

    public function test_nonexistent_note_channel_denied(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/broadcasting/auth', [
            'channel_name' => 'private-notes.999999',
            'socket_id' => '1234.5678',
        ]);

        $response->assertForbidden();
    }

    // =========================================================================
    // DATA ISOLATION & LEAKAGE DEFENSE
    // =========================================================================

    public function test_channel_auth_response_does_not_expose_note_data_or_secrets(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Confidential Quantum Project',
            'content' => 'High-level architectural blueprint and schematic data.',
            'protection_password_hash' => Hash::make('SuperSecretPassword2026!'),
        ]);

        // Attach a label and an attachment
        $label = $owner->labels()->create(['name' => 'Restricted Tag', 'color' => '#ef4444']);
        $note->labels()->attach($label->id);

        $note->attachments()->create([
            'original_name' => 'secret_blueprint.pdf',
            'path' => 'attachments/secret_blueprint_uuid.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
        ]);

        $response = $this->actingAs($owner)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);

        $response->assertOk();

        $rawResponse = $response->getContent();
        // Assert only auth field is returned
        $this->assertEquals(['auth'], array_keys($response->json()));
        $this->assertStringNotContainsString('Confidential Quantum Project', $rawResponse);
        $this->assertStringNotContainsString('High-level architectural blueprint', $rawResponse);
        $this->assertStringNotContainsString('SuperSecretPassword2026!', $rawResponse);
        $this->assertStringNotContainsString('Restricted Tag', $rawResponse);
        $this->assertStringNotContainsString('secret_blueprint.pdf', $rawResponse);
        $this->assertStringNotContainsString('attachments/', $rawResponse);
    }

    public function test_protected_locked_note_authorizes_channel_without_unlock_password(): void
    {
        $owner = $this->createUser();
        $collaborator = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Locked Vault Document',
            'content' => 'Encrypted content behind password protection.',
            'protection_password_hash' => Hash::make('VaultLockPass2026!'),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collaborator->id,
            'permission' => 'read',
        ]);

        // Neither owner nor collaborator have unlocked the note in session
        // Collaborator can still subscribe to the channel based on view capability
        $collabResponse = $this->actingAs($collaborator)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);
        $collabResponse->assertOk();
        $collabResponse->assertJsonStructure(['auth']);
        $this->assertStringNotContainsString('Encrypted content', $collabResponse->getContent());

        // Owner can also subscribe while note is locked in session
        $ownerResponse = $this->actingAs($owner)->postJson('/broadcasting/auth', [
            'channel_name' => "private-notes.{$note->id}",
            'socket_id' => '1234.5678',
        ]);
        $ownerResponse->assertOk();
        $ownerResponse->assertJsonStructure(['auth']);
        $this->assertStringNotContainsString('Encrypted content', $ownerResponse->getContent());
    }
}
