<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class ProtectedNoteTest extends DatabaseTestCase
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

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    // =========================================================================
    // AUTHORIZATION & ANONYMOUS
    // =========================================================================

    public function test_anonymous_user_cannot_access_protection_endpoints(): void
    {
        $note = Note::factory()->create();

        $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
        ])->assertUnauthorized();

        $this->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'SecretPass123!',
        ])->assertUnauthorized();

        $this->postJson("/api/notes/{$note->id}/lock")->assertUnauthorized();

        $this->deleteJson("/api/notes/{$note->id}/protection", [
            'password' => 'SecretPass123!',
        ])->assertUnauthorized();
    }

    public function test_foreign_user_cannot_protect_another_users_note(): void
    {
        $this->authenticatedUser();
        $foreignNote = Note::factory()->create();

        $this->putJson("/api/notes/{$foreignNote->id}/protection", [
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
        ])->assertForbidden();
    }

    public function test_foreign_user_cannot_unlock_another_users_note(): void
    {
        $this->authenticatedUser();
        $foreignNote = Note::factory()->create([
            'protection_password_hash' => Hash::make('SecretPass123!'),
        ]);

        $this->postJson("/api/notes/{$foreignNote->id}/unlock", [
            'password' => 'SecretPass123!',
        ])->assertForbidden();
    }

    public function test_foreign_user_cannot_remove_protection(): void
    {
        $this->authenticatedUser();
        $foreignNote = Note::factory()->create([
            'protection_password_hash' => Hash::make('SecretPass123!'),
        ]);

        $this->deleteJson("/api/notes/{$foreignNote->id}/protection", [
            'password' => 'SecretPass123!',
        ])->assertForbidden();
    }

    // =========================================================================
    // PROTECTION LIFECYCLE (SET, RESOURCE, PLAIN TEXT ABSENCE)
    // =========================================================================

    public function test_owner_can_protect_own_note_with_valid_password(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Secret Thesis',
            'content' => 'Top secret experimental data.',
        ]);

        $response = $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'Research2026!',
            'password_confirmation' => 'Research2026!',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $note->id)
            ->assertJsonPath('data.is_protected', true)
            ->assertJsonPath('data.is_unlocked', true)
            ->assertJsonPath('data.content', 'Top secret experimental data.')
            ->assertJsonMissing(['protection_password_hash']);

        $note->refresh();
        $this->assertNotNull($note->protection_password_hash);
        $this->assertTrue(Hash::check('Research2026!', $note->protection_password_hash));
        $this->assertStringNotContainsString('Research2026!', (string) $note->protection_password_hash);
    }

    public function test_protect_requires_minimum_8_characters_and_confirmation(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        // Short password
        $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        // Password mismatch
        $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'ValidPassword123!',
            'password_confirmation' => 'Mismatch123!',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
    }

    // =========================================================================
    // LOCK / UNLOCK / CONTENT REDACTION
    // =========================================================================

    public function test_protected_locked_note_returns_content_null(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Encrypted Notebook',
            'content' => 'Hidden confidential content.',
            'protection_password_hash' => Hash::make('MyPassword123!'),
        ]);

        // Reading without prior session unlock
        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $note->id)
            ->assertJsonPath('data.title', 'Encrypted Notebook')
            ->assertJsonPath('data.is_protected', true)
            ->assertJsonPath('data.is_unlocked', false)
            ->assertJsonPath('data.content', null)
            ->assertJsonMissing(['protection_password_hash']);
    }

    public function test_unprotected_note_returns_content_and_unlocked_true(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Open Notebook',
            'content' => 'Visible plaintext content.',
            'protection_password_hash' => null,
        ]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk()
            ->assertJsonPath('data.is_protected', false)
            ->assertJsonPath('data.is_unlocked', true)
            ->assertJsonPath('data.content', 'Visible plaintext content.');
    }

    public function test_correct_password_unlocks_note_and_returns_content(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Private Musings',
            'content' => 'Unlocked thoughts.',
            'protection_password_hash' => Hash::make('Passphrase456!'),
        ]);

        $response = $this->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'Passphrase456!',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_protected', true)
            ->assertJsonPath('data.is_unlocked', true)
            ->assertJsonPath('data.content', 'Unlocked thoughts.');

        // Subsequent GET in the same session is unlocked
        $this->getJson("/api/notes/{$note->id}")
            ->assertOk()
            ->assertJsonPath('data.is_unlocked', true)
            ->assertJsonPath('data.content', 'Unlocked thoughts.');
    }

    public function test_wrong_password_does_not_unlock_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'content' => 'Confidential',
            'protection_password_hash' => Hash::make('CorrectPassword123!'),
        ]);

        $response = $this->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'WrongPassword999!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        // Remains locked
        $this->getJson("/api/notes/{$note->id}")
            ->assertOk()
            ->assertJsonPath('data.is_unlocked', false)
            ->assertJsonPath('data.content', null);
    }

    public function test_manual_lock_clears_session_grant_and_redacts_content(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'content' => 'Confidential',
            'protection_password_hash' => Hash::make('Passphrase123!'),
        ]);

        // Unlock
        $this->postJson("/api/notes/{$note->id}/unlock", ['password' => 'Passphrase123!'])->assertOk();

        // Lock
        $lockRes = $this->postJson("/api/notes/{$note->id}/lock");
        $lockRes->assertOk()
            ->assertJsonPath('data.is_protected', true)
            ->assertJsonPath('data.is_unlocked', false)
            ->assertJsonPath('data.content', null);

        // Subsequent GET is locked
        $this->getJson("/api/notes/{$note->id}")
            ->assertOk()
            ->assertJsonPath('data.is_unlocked', false)
            ->assertJsonPath('data.content', null);
    }

    public function test_unlock_rate_limiting_triggers_429_after_5_failures(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'protection_password_hash' => Hash::make('SecretPass123!'),
        ]);

        // 5 wrong attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson("/api/notes/{$note->id}/unlock", [
                'password' => "BadPass{$i}!",
            ])->assertUnprocessable();
        }

        // 6th attempt throttled
        $this->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'BadPass6!',
        ])->assertStatus(429);
    }

    // =========================================================================
    // REMOVE PROTECTION
    // =========================================================================

    public function test_remove_protection_with_correct_password_succeeds(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'content' => 'Previously secret',
            'protection_password_hash' => Hash::make('UnlockPass123!'),
        ]);

        $response = $this->deleteJson("/api/notes/{$note->id}/protection", [
            'password' => 'UnlockPass123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_protected', false)
            ->assertJsonPath('data.is_unlocked', true)
            ->assertJsonPath('data.content', 'Previously secret');

        $note->refresh();
        $this->assertNull($note->protection_password_hash);
    }

    public function test_remove_protection_with_wrong_password_is_rejected(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'protection_password_hash' => Hash::make('UnlockPass123!'),
        ]);

        $this->deleteJson("/api/notes/{$note->id}/protection", [
            'password' => 'WrongPass!',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        $note->refresh();
        $this->assertNotNull($note->protection_password_hash);
    }

    // =========================================================================
    // PATCH / MUTATION GUARDS
    // =========================================================================

    public function test_locked_note_patch_is_rejected_with_423(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
            'protection_password_hash' => Hash::make('GuardPass123!'),
        ]);

        $response = $this->patchJson("/api/notes/{$note->id}", [
            'title' => 'Attempted Edit',
            'content' => 'Attempted Content',
        ]);

        $response->assertStatus(423)
            ->assertJson(['message' => 'Unlock this note before editing.']);

        $note->refresh();
        $this->assertSame('Original Title', $note->title);
        $this->assertSame('Original Content', $note->content);
    }

    public function test_unlocked_note_patch_succeeds(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
            'protection_password_hash' => Hash::make('GuardPass123!'),
        ]);

        // Unlock
        $this->postJson("/api/notes/{$note->id}/unlock", ['password' => 'GuardPass123!'])->assertOk();

        $response = $this->patchJson("/api/notes/{$note->id}", [
            'title' => 'Updated Title',
            'content' => 'Updated Content',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.content', 'Updated Content');

        $note->refresh();
        $this->assertSame('Updated Title', $note->title);
        $this->assertSame('Updated Content', $note->content);
    }

    public function test_password_replacement_requires_unlocked_state(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'protection_password_hash' => Hash::make('OldPass123!'),
        ]);

        // Attempting to replace password while locked
        $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ])->assertStatus(423);

        // Unlock first
        $this->postJson("/api/notes/{$note->id}/unlock", ['password' => 'OldPass123!'])->assertOk();

        // Now replacement succeeds
        $this->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ])->assertOk();

        $note->refresh();
        $this->assertTrue(Hash::check('NewPass123!', $note->protection_password_hash));
        $this->assertFalse(Hash::check('OldPass123!', $note->protection_password_hash));
    }

    // =========================================================================
    // SEARCH CONFIDENTIALITY & CONTENT ORACLE DEFENSE (SECTION 21 & 33)
    // =========================================================================

    public function test_locked_note_title_is_searchable_but_secret_body_is_not(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Quarterly Financials',
            'content' => 'classified_merger_phrase_xyz',
            'protection_password_hash' => Hash::make('SecretPass123!'),
        ]);

        // 1. Search by title -> note is returned (locked representation)
        $titleSearch = $this->getJson('/api/notes?q=Financials');
        $titleSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $note->id)
            ->assertJsonPath('data.0.is_unlocked', false)
            ->assertJsonPath('data.0.content', null);

        // 2. Search by secret body phrase while locked -> NOT returned (content oracle defense)
        $secretSearch = $this->getJson('/api/notes?q=classified_merger_phrase_xyz');
        $secretSearch->assertOk()
            ->assertJsonCount(0, 'data');

        // 3. Unlock note in current session
        $this->postJson("/api/notes/{$note->id}/unlock", ['password' => 'SecretPass123!'])->assertOk();

        // 4. Search by secret phrase after unlock -> now MATCHES
        $unlockedSearch = $this->getJson('/api/notes?q=classified_merger_phrase_xyz');
        $unlockedSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $note->id)
            ->assertJsonPath('data.0.is_unlocked', true)
            ->assertJsonPath('data.0.content', 'classified_merger_phrase_xyz');

        // 5. Re-lock note
        $this->postJson("/api/notes/{$note->id}/lock")->assertOk();

        // 6. Secret phrase search again -> NO LONGER MATCHES
        $relockedSearch = $this->getJson('/api/notes?q=classified_merger_phrase_xyz');
        $relockedSearch->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
