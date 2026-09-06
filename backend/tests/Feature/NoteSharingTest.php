<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\DatabaseTestCase;

class NoteSharingTest extends DatabaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->withHeaders([
            'Referer' => 'http://localhost:5173',
            'Origin' => 'http://localhost:5173',
        ]);
    }

    private function createUser(): User
    {
        return User::factory()->create();
    }

    // =========================================================================
    // 1. SHARE CREATION & VALIDATION (SHARE-03)
    // =========================================================================

    public function test_anonymous_user_cannot_access_share_endpoints(): void
    {
        $note = Note::factory()->create();
        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $note->user_id,
            'shared_with_user_id' => User::factory()->create()->id,
            'permission' => 'read',
        ]);

        $this->getJson("/api/notes/{$note->id}/shares")->assertUnauthorized();
        $this->postJson("/api/notes/{$note->id}/shares", ['email' => 'a@b.com', 'permission' => 'read'])->assertUnauthorized();
        $this->patchJson("/api/note-shares/{$share->id}", ['permission' => 'edit'])->assertUnauthorized();
        $this->deleteJson("/api/note-shares/{$share->id}")->assertUnauthorized();
    }

    public function test_owner_can_share_note_with_read_permission(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'read',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.note_id', $note->id);
        $response->assertJsonPath('data.permission', 'read');
        $response->assertJsonPath('data.recipient.id', $recipient->id);
        $response->assertJsonPath('data.recipient.email', $recipient->email);
        $response->assertJsonPath('data.recipient.display_name', $recipient->display_name);

        $this->assertDatabaseHas('note_shares', [
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);
    }

    public function test_owner_can_share_note_with_edit_permission(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'edit',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.permission', 'edit');
        $this->assertDatabaseHas('note_shares', [
            'note_id' => $note->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'edit',
        ]);
    }

    public function test_email_matching_is_case_insensitive_and_normalized(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $upperEmail = '  '.strtoupper($recipient->email).'  ';
        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $upperEmail,
            'permission' => 'read',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('note_shares', [
            'note_id' => $note->id,
            'shared_with_user_id' => $recipient->id,
        ]);
    }

    public function test_shared_by_is_derived_server_side_and_cannot_be_spoofed(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $otherUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'read',
            'shared_by_user_id' => $otherUser->id,
            'shared_with_user_id' => $otherUser->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('note_shares', [
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
        ]);
    }

    public function test_self_sharing_is_rejected_with_422(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $owner->email,
            'permission' => 'read',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_unknown_email_is_rejected_with_422(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => 'nonexistent_person_99999@example.com',
            'permission' => 'read',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $response->assertJsonPath('errors.email.0', 'Unable to share with that email address.');
    }

    public function test_invalid_permission_string_is_rejected_with_422(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'admin',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['permission']);
    }

    public function test_duplicate_share_to_same_recipient_is_rejected_with_422(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        // First share succeeds
        $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'read',
        ])->assertCreated();

        // Second share to same user rejected
        $second = $this->actingAs($owner)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'edit',
        ]);

        $second->assertStatus(422);
        $second->assertJsonValidationErrors(['email']);
        $this->assertCount(1, $note->shares);
    }

    public function test_foreign_user_cannot_share_owners_note(): void
    {
        $owner = $this->createUser();
        $foreign = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($foreign)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $recipient->email,
            'permission' => 'read',
        ])->assertForbidden();
    }

    public function test_read_collaborator_cannot_reshare_note(): void
    {
        $owner = $this->createUser();
        $readUser = $this->createUser();
        $thirdUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $readUser->id,
            'permission' => 'read',
        ]);

        $this->actingAs($readUser)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $thirdUser->email,
            'permission' => 'read',
        ])->assertForbidden();
    }

    public function test_edit_collaborator_cannot_reshare_note(): void
    {
        $owner = $this->createUser();
        $editUser = $this->createUser();
        $thirdUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $editUser->id,
            'permission' => 'edit',
        ]);

        $this->actingAs($editUser)->postJson("/api/notes/{$note->id}/shares", [
            'email' => $thirdUser->email,
            'permission' => 'read',
        ])->assertForbidden();
    }

    public function test_owner_can_list_shares_collaborator_cannot(): void
    {
        $owner = $this->createUser();
        $readUser = $this->createUser();
        $editUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $readUser->id,
            'permission' => 'read',
        ]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $editUser->id,
            'permission' => 'edit',
        ]);

        $ownerRes = $this->actingAs($owner)->getJson("/api/notes/{$note->id}/shares");
        $ownerRes->assertOk();
        $ownerRes->assertJsonCount(2, 'data');

        $this->actingAs($readUser)->getJson("/api/notes/{$note->id}/shares")->assertForbidden();
        $this->actingAs($editUser)->getJson("/api/notes/{$note->id}/shares")->assertForbidden();
    }

    // =========================================================================
    // 2. PERMISSION MATRIX (SHARE-04)
    // =========================================================================

    public function test_owner_has_full_capabilities(): void
    {
        $owner = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id, 'title' => 'Original']);

        // View
        $this->actingAs($owner)->getJson("/api/notes/{$note->id}")->assertOk();

        // Patch content
        $this->actingAs($owner)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Owner Edited',
            'content' => 'Owner Content',
        ])->assertOk();

        // Pin
        $this->actingAs($owner)->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ])->assertOk();

        // Manage labels
        $label = $owner->labels()->create(['name' => 'CS', 'color' => '#3b82f6']);
        $this->actingAs($owner)->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$label->id],
        ])->assertOk();

        // Manage protection
        $this->actingAs($owner)->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'Pass1234!',
            'password_confirmation' => 'Pass1234!',
        ])->assertOk();

        // Delete
        $this->actingAs($owner)->deleteJson("/api/notes/{$note->id}")->assertNoContent();
    }

    public function test_read_collaborator_matrix(): void
    {
        $owner = $this->createUser();
        $readUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id, 'title' => 'Lecture Note']);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $readUser->id,
            'permission' => 'read',
        ]);

        // 1. View: PASS
        $res = $this->actingAs($readUser)->getJson("/api/notes/{$note->id}");
        $res->assertOk();
        $res->assertJsonPath('data.title', 'Lecture Note');
        $res->assertJsonPath('data.access_type', 'shared');
        $res->assertJsonPath('data.permission', 'read');

        // 2. Patch content: 403
        $this->actingAs($readUser)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Hacked Title',
            'content' => 'Hacked Content',
        ])->assertForbidden();

        // 3. Delete: 403
        $this->actingAs($readUser)->deleteJson("/api/notes/{$note->id}")->assertForbidden();

        // 4. Pin: 403
        $this->actingAs($readUser)->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ])->assertForbidden();

        // 5. Label sync: 403
        $this->actingAs($readUser)->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [],
        ])->assertForbidden();

        // 6. Manage protection (set password): 403
        $this->actingAs($readUser)->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'CollabPass1!',
            'password_confirmation' => 'CollabPass1!',
        ])->assertForbidden();

        // 7. Remove protection: 403
        $this->actingAs($readUser)->deleteJson("/api/notes/{$note->id}/protection", [
            'password' => 'AnyPassword!',
        ])->assertForbidden();

        // 8. Manage shares: 403
        $this->actingAs($readUser)->getJson("/api/notes/{$note->id}/shares")->assertForbidden();
    }

    public function test_edit_collaborator_matrix(): void
    {
        $owner = $this->createUser();
        $editUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id, 'title' => 'Lab Spec']);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $editUser->id,
            'permission' => 'edit',
        ]);

        // 1. View: PASS
        $res = $this->actingAs($editUser)->getJson("/api/notes/{$note->id}");
        $res->assertOk();
        $res->assertJsonPath('data.title', 'Lab Spec');
        $res->assertJsonPath('data.access_type', 'shared');
        $res->assertJsonPath('data.permission', 'edit');

        // 2. Patch content: PASS
        $patchRes = $this->actingAs($editUser)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Lab Spec - Edited by Collaborator',
            'content' => 'Updated experimental setup steps.',
        ]);
        $patchRes->assertOk();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Lab Spec - Edited by Collaborator',
        ]);

        // 3. Delete: 403
        $this->actingAs($editUser)->deleteJson("/api/notes/{$note->id}")->assertForbidden();

        // 4. Pin: 403
        $this->actingAs($editUser)->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ])->assertForbidden();

        // 5. Label sync: 403
        $this->actingAs($editUser)->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [],
        ])->assertForbidden();

        // 6. Manage protection: 403
        $this->actingAs($editUser)->putJson("/api/notes/{$note->id}/protection", [
            'password' => 'CollabPass1!',
            'password_confirmation' => 'CollabPass1!',
        ])->assertForbidden();

        // 7. Remove protection: 403
        $this->actingAs($editUser)->deleteJson("/api/notes/{$note->id}/protection", [
            'password' => 'AnyPassword!',
        ])->assertForbidden();

        // 8. Manage shares: 403
        $this->actingAs($editUser)->getJson("/api/notes/{$note->id}/shares")->assertForbidden();
    }

    public function test_unshared_user_denied_all_access(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($stranger)->getJson("/api/notes/{$note->id}")->assertForbidden();
        $this->actingAs($stranger)->patchJson("/api/notes/{$note->id}", ['title' => 'X'])->assertForbidden();
        $this->actingAs($stranger)->deleteJson("/api/notes/{$note->id}")->assertForbidden();
        $this->actingAs($stranger)->patchJson("/api/notes/{$note->id}/pin", ['is_pinned' => true])->assertForbidden();
        $this->actingAs($stranger)->putJson("/api/notes/{$note->id}/labels", ['label_ids' => []])->assertForbidden();
        $this->actingAs($stranger)->putJson("/api/notes/{$note->id}/protection", ['password' => 'p', 'password_confirmation' => 'p'])->assertForbidden();
        $this->actingAs($stranger)->getJson("/api/notes/{$note->id}/shares")->assertForbidden();
    }

    // =========================================================================
    // 3. ATTACHMENT PERMISSIONS MATRIX (SEC-04 & SHARE-04)
    // =========================================================================

    public function test_read_collaborator_attachment_permissions(): void
    {
        $owner = $this->createUser();
        $readUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $readUser->id,
            'permission' => 'read',
        ]);

        $filePath = "attachments/{$note->id}/test.pdf";
        Storage::disk('local')->put($filePath, 'PDF DATA');
        $attachment = $note->attachments()->create([
            'original_name' => 'test.pdf',
            'path' => $filePath,
            'mime_type' => 'application/pdf',
            'size_bytes' => 8,
        ]);

        // List attachments: PASS
        $listRes = $this->actingAs($readUser)->getJson("/api/notes/{$note->id}/attachments");
        $listRes->assertOk();
        $listRes->assertJsonCount(1, 'data');

        // View inline stream: PASS
        $this->actingAs($readUser)->get("/api/attachments/{$attachment->id}/content")->assertOk();

        // Download: PASS
        $this->actingAs($readUser)->get("/api/attachments/{$attachment->id}/download")->assertOk();

        // Upload: 403
        $file = UploadedFile::fake()->create('hacked.pdf', 10, 'application/pdf');
        $this->actingAs($readUser)->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ])->assertForbidden();

        // Delete attachment: 403
        $this->actingAs($readUser)->deleteJson("/api/attachments/{$attachment->id}")->assertForbidden();
    }

    public function test_edit_collaborator_attachment_permissions(): void
    {
        $owner = $this->createUser();
        $editUser = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $editUser->id,
            'permission' => 'edit',
        ]);

        $filePath = "attachments/{$note->id}/original.pdf";
        Storage::disk('local')->put($filePath, 'PDF DATA');
        $attachment = $note->attachments()->create([
            'original_name' => 'original.pdf',
            'path' => $filePath,
            'mime_type' => 'application/pdf',
            'size_bytes' => 8,
        ]);

        // List: PASS
        $this->actingAs($editUser)->getJson("/api/notes/{$note->id}/attachments")->assertOk();

        // Download: PASS
        $this->actingAs($editUser)->get("/api/attachments/{$attachment->id}/download")->assertOk();

        // Upload: PASS
        $newFile = UploadedFile::fake()->create('diagram.png', 50, 'image/png');
        $uploadRes = $this->actingAs($editUser)->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $newFile,
        ]);
        $uploadRes->assertCreated();

        // Delete: PASS
        $this->actingAs($editUser)->deleteJson("/api/attachments/{$attachment->id}")->assertNoContent();
        $this->assertDatabaseMissing('attachments', ['id' => $attachment->id]);
    }

    public function test_unshared_user_denied_all_attachment_endpoints(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        $attachment = $note->attachments()->create([
            'original_name' => 'secret.pdf',
            'path' => "attachments/{$note->id}/secret.pdf",
            'mime_type' => 'application/pdf',
            'size_bytes' => 10,
        ]);

        $this->actingAs($stranger)->getJson("/api/notes/{$note->id}/attachments")->assertForbidden();
        $this->actingAs($stranger)->get("/api/attachments/{$attachment->id}/content")->assertForbidden();
        $this->actingAs($stranger)->get("/api/attachments/{$attachment->id}/download")->assertForbidden();
        $this->actingAs($stranger)->deleteJson("/api/attachments/{$attachment->id}")->assertForbidden();
    }

    // =========================================================================
    // 4. PROTECTION COMPOSITION & SESSION ISOLATION
    // =========================================================================

    public function test_protected_shared_note_requires_recipient_unlock_before_body_access(): void
    {
        $owner = $this->createUser();
        $readUser = $this->createUser();
        $notePassword = 'ProtectedShare2026!';
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Confidential Blueprint',
            'content' => 'Top secret blueprint content.',
            'protection_password_hash' => Hash::make($notePassword),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $readUser->id,
            'permission' => 'read',
        ]);

        // 1. Read collaborator initially sees title but content is null
        $lockedRes = $this->actingAs($readUser)->getJson("/api/notes/{$note->id}");
        $lockedRes->assertOk();
        $lockedRes->assertJsonPath('data.title', 'Confidential Blueprint');
        $lockedRes->assertJsonPath('data.content', null);
        $lockedRes->assertJsonPath('data.is_protected', true);
        $lockedRes->assertJsonPath('data.is_unlocked', false);

        // 2. Wrong password fails unlock
        $wrongRes = $this->actingAs($readUser)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'WrongPassword123!',
        ]);
        $wrongRes->assertStatus(422);

        // 3. Correct password unlocks for read collaborator session
        $unlockRes = $this->actingAs($readUser)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => $notePassword,
        ]);
        $unlockRes->assertOk();
        $unlockRes->assertJsonPath('data.content', 'Top secret blueprint content.');
        $unlockRes->assertJsonPath('data.is_unlocked', true);

        // 4. Subsequent GET in same session reveals content
        $unlockedRes = $this->actingAs($readUser)->getJson("/api/notes/{$note->id}");
        $unlockedRes->assertOk();
        $unlockedRes->assertJsonPath('data.content', 'Top secret blueprint content.');

        // 5. Read collaborator still cannot PATCH even when unlocked
        $this->actingAs($readUser)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Read Attempt',
            'content' => 'Read Content',
        ])->assertForbidden();
    }

    public function test_edit_collaborator_locked_patch_rejected_with_423_and_unlocked_patch_succeeds(): void
    {
        $owner = $this->createUser();
        $editUser = $this->createUser();
        $notePassword = 'SecretEditPass123!';
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Collaborative Draft',
            'content' => 'Base version of the document.',
            'protection_password_hash' => Hash::make($notePassword),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $editUser->id,
            'permission' => 'edit',
        ]);

        // 1. PATCH while locked returns 423
        $lockedPatch = $this->actingAs($editUser)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Attempted Edit',
            'content' => 'Attempted Content',
        ]);
        $lockedPatch->assertStatus(423);

        // 2. Unlock note
        $this->actingAs($editUser)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => $notePassword,
        ])->assertOk();

        // 3. PATCH while unlocked succeeds
        $successPatch = $this->actingAs($editUser)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Collaborative Draft - Revised',
            'content' => 'Revised version of the document.',
        ]);
        $successPatch->assertOk();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Collaborative Draft - Revised',
        ]);
    }

    public function test_owner_unlock_does_not_unlock_collaborator_session(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $notePassword = 'IndependentUnlock1!';
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'content' => 'Secret Content',
            'protection_password_hash' => Hash::make($notePassword),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        // Owner unlocks in owner's session
        $this->actingAs($owner)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => $notePassword,
        ])->assertOk();

        // Recipient in fresh, isolated session is STILL locked
        $this->flushSession();
        $recipientRes = $this->actingAs($recipient)->getJson("/api/notes/{$note->id}");
        $recipientRes->assertOk();
        $recipientRes->assertJsonPath('data.content', null);
        $recipientRes->assertJsonPath('data.is_unlocked', false);
    }

    public function test_recipient_a_unlock_does_not_unlock_recipient_b_session(): void
    {
        $owner = $this->createUser();
        $recipientA = $this->createUser();
        $recipientB = $this->createUser();
        $notePassword = 'DoubleCollabPass1!';
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'content' => 'Isolated Content',
            'protection_password_hash' => Hash::make($notePassword),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipientA->id,
            'permission' => 'read',
        ]);
        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipientB->id,
            'permission' => 'read',
        ]);

        // Recipient A unlocks in their session
        $this->actingAs($recipientA)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => $notePassword,
        ])->assertOk();

        // Recipient B in their own isolated session is STILL locked
        $this->flushSession();
        $resB = $this->actingAs($recipientB)->getJson("/api/notes/{$note->id}");
        $resB->assertOk();
        $resB->assertJsonPath('data.content', null);
        $resB->assertJsonPath('data.is_unlocked', false);
    }

    // =========================================================================
    // 5. PERMISSION UPDATES & REVOCATION LIFECYCLE
    // =========================================================================

    public function test_owner_can_downgrade_permission_edit_to_read(): void
    {
        $owner = $this->createUser();
        $collab = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collab->id,
            'permission' => 'edit',
        ]);

        // 1. Edit collaborator can edit
        $this->actingAs($collab)->patchJson("/api/notes/{$note->id}", [
            'title' => 'First Edit',
            'content' => 'First Content',
        ])->assertOk();

        // 2. Owner downgrades to read
        $patchShare = $this->actingAs($owner)->patchJson("/api/note-shares/{$share->id}", [
            'permission' => 'read',
        ]);
        $patchShare->assertOk();
        $patchShare->assertJsonPath('data.permission', 'read');

        // 3. Collab can still view
        $this->actingAs($collab)->getJson("/api/notes/{$note->id}")->assertOk();

        // 4. Collab PATCH now immediately returns 403 without relogin
        $this->actingAs($collab)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Second Edit',
            'content' => 'Second Content',
        ])->assertForbidden();
    }

    public function test_owner_can_upgrade_permission_read_to_edit(): void
    {
        $owner = $this->createUser();
        $collab = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collab->id,
            'permission' => 'read',
        ]);

        // 1. Initially cannot edit
        $this->actingAs($collab)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Early Edit',
            'content' => 'Early Content',
        ])->assertForbidden();

        // 2. Owner upgrades to edit
        $this->actingAs($owner)->patchJson("/api/note-shares/{$share->id}", [
            'permission' => 'edit',
        ])->assertOk();

        // 3. Collab PATCH now succeeds immediately
        $this->actingAs($collab)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Approved Edit',
            'content' => 'Approved Content',
        ])->assertOk();
    }

    public function test_owner_can_revoke_share_and_access_is_immediately_severed(): void
    {
        $owner = $this->createUser();
        $collab = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collab->id,
            'permission' => 'edit',
        ]);

        // 1. Collab can access
        $this->actingAs($collab)->getJson("/api/notes/{$note->id}")->assertOk();

        // 2. Owner revokes share
        $revokeRes = $this->actingAs($owner)->deleteJson("/api/note-shares/{$share->id}");
        $revokeRes->assertNoContent();
        $this->assertDatabaseMissing('note_shares', ['id' => $share->id]);

        // 3. Collab direct GET returns 403
        $this->actingAs($collab)->getJson("/api/notes/{$note->id}")->assertForbidden();

        // 4. Collab PATCH returns 403
        $this->actingAs($collab)->patchJson("/api/notes/{$note->id}", [
            'title' => 'Revoked Edit',
            'content' => 'Revoked Content',
        ])->assertForbidden();
    }

    public function test_revoked_recipient_with_stale_unlock_grant_is_denied_access(): void
    {
        $owner = $this->createUser();
        $collab = $this->createUser();
        $notePassword = 'RevokeUnlockTest1!';
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'content' => 'Confidential text.',
            'protection_password_hash' => Hash::make($notePassword),
        ]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collab->id,
            'permission' => 'read',
        ]);

        // 1. Collab unlocks note in their session
        $this->actingAs($collab)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => $notePassword,
        ])->assertOk();

        // 2. Collab has body access
        $this->actingAs($collab)->getJson("/api/notes/{$note->id}")->assertOk();

        // 3. Owner revokes the share
        $this->actingAs($owner)->deleteJson("/api/note-shares/{$share->id}")->assertNoContent();

        // 4. Collab in same session (holding stale unlock token) is denied with 403
        $this->actingAs($collab)->getJson("/api/notes/{$note->id}")->assertForbidden();
    }

    // =========================================================================
    // 6. LABEL PRIVACY CONTRACT
    // =========================================================================

    public function test_owner_private_labels_not_leaked_to_collaborators(): void
    {
        $owner = $this->createUser();
        $collab = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $label = $owner->labels()->create([
            'name' => 'Owner Secret Project',
            'color' => '#ef4444',
        ]);
        $note->labels()->attach($label->id);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $collab->id,
            'permission' => 'read',
        ]);

        // Owner sees the label
        $ownerRes = $this->actingAs($owner)->getJson("/api/notes/{$note->id}");
        $ownerRes->assertOk();
        $ownerRes->assertJsonCount(1, 'data.labels');
        $ownerRes->assertJsonPath('data.labels.0.name', 'Owner Secret Project');

        // Collaborator gets empty labels array (no metadata leakage)
        $collabRes = $this->actingAs($collab)->getJson("/api/notes/{$note->id}");
        $collabRes->assertOk();
        $collabRes->assertJsonCount(0, 'data.labels');
        $collabRes->assertJsonPath('data.labels', []);
    }

    // =========================================================================
    // 7. RECIPIENT SHARED WORKSPACE (SHARE-05)
    // =========================================================================

    public function test_anonymous_user_cannot_access_shared_notes(): void
    {
        $this->getJson('/api/shared-notes')->assertUnauthorized();
    }

    public function test_recipient_lists_own_received_shares_with_metadata(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Quarterly Strategic Plan',
            'content' => 'High level roadmap objectives.',
        ]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($recipient)->getJson('/api/shared-notes');
        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.share_id', $share->id);
        $response->assertJsonPath('data.0.permission', 'read');
        $response->assertJsonPath('data.0.shared_by.id', $owner->id);
        $response->assertJsonPath('data.0.shared_by.display_name', $owner->display_name);
        $response->assertJsonPath('data.0.shared_by.email', $owner->email);
        $response->assertJsonPath('data.0.note.id', $note->id);
        $response->assertJsonPath('data.0.note.title', 'Quarterly Strategic Plan');
        $response->assertJsonPath('data.0.note.content', 'High level roadmap objectives.');
        $response->assertJsonPath('data.0.note.is_protected', false);
        $response->assertJsonPath('data.0.note.is_unlocked', true);
    }

    public function test_owner_own_notes_not_returned_from_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        // Owner gets empty list from /api/shared-notes
        $response = $this->actingAs($owner)->getJson('/api/shared-notes');
        $response->assertOk();
        $response->assertJsonCount(0, 'data');
    }

    public function test_other_recipients_shares_excluded_from_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipientA = $this->createUser();
        $recipientB = $this->createUser();
        $note1 = Note::factory()->create(['user_id' => $owner->id, 'title' => 'For Recipient A']);
        $note2 = Note::factory()->create(['user_id' => $owner->id, 'title' => 'For Recipient B']);

        NoteShare::create([
            'note_id' => $note1->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipientA->id,
            'permission' => 'read',
        ]);

        NoteShare::create([
            'note_id' => $note2->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipientB->id,
            'permission' => 'edit',
        ]);

        $resA = $this->actingAs($recipientA)->getJson('/api/shared-notes');
        $resA->assertOk();
        $resA->assertJsonCount(1, 'data');
        $resA->assertJsonPath('data.0.note.title', 'For Recipient A');

        $resB = $this->actingAs($recipientB)->getJson('/api/shared-notes');
        $resB->assertOk();
        $resB->assertJsonCount(1, 'data');
        $resB->assertJsonPath('data.0.note.title', 'For Recipient B');
    }

    public function test_revoked_share_disappears_from_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        $this->actingAs($recipient)->getJson('/api/shared-notes')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Owner revokes share
        $this->actingAs($owner)->deleteJson("/api/note-shares/{$share->id}")
            ->assertNoContent();

        // Recipient no longer sees it in shared workspace
        $this->actingAs($recipient)->getJson('/api/shared-notes')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_permission_update_reflected_in_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        $share = NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        $this->actingAs($recipient)->getJson('/api/shared-notes')
            ->assertJsonPath('data.0.permission', 'read');

        // Owner upgrades permission to edit
        $this->actingAs($owner)->patchJson("/api/note-shares/{$share->id}", [
            'permission' => 'edit',
        ])->assertOk();

        // Recipient immediately sees edit permission
        $this->actingAs($recipient)->getJson('/api/shared-notes')
            ->assertJsonPath('data.0.permission', 'edit');
    }

    public function test_protected_locked_shared_note_redacts_content_and_sets_unlocked_false(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Secret Architecture Blueprint',
            'content' => 'Top secret blueprint content that must be redacted.',
            'protection_password_hash' => Hash::make('VaultKey2026!'),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        // Recipient has not unlocked in session
        $res = $this->actingAs($recipient)->getJson('/api/shared-notes');
        $res->assertOk();
        $res->assertJsonPath('data.0.note.title', 'Secret Architecture Blueprint');
        $res->assertJsonPath('data.0.note.is_protected', true);
        $res->assertJsonPath('data.0.note.is_unlocked', false);
        $res->assertJsonPath('data.0.note.content', null);
    }

    public function test_protected_unlocked_recipient_gets_content_in_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Secret Architecture Blueprint',
            'content' => 'Top secret blueprint content.',
            'protection_password_hash' => Hash::make('VaultKey2026!'),
        ]);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        // Recipient unlocks in session
        $this->actingAs($recipient)->postJson("/api/notes/{$note->id}/unlock", [
            'password' => 'VaultKey2026!',
        ])->assertOk();

        // Recipient now sees unlocked content
        $res = $this->actingAs($recipient)->getJson('/api/shared-notes');
        $res->assertOk();
        $res->assertJsonPath('data.0.note.is_protected', true);
        $res->assertJsonPath('data.0.note.is_unlocked', true);
        $res->assertJsonPath('data.0.note.content', 'Top secret blueprint content.');
    }

    public function test_owner_labels_and_protection_hash_absent_from_shared_notes(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();
        $note = Note::factory()->create([
            'user_id' => $owner->id,
            'protection_password_hash' => Hash::make('VaultKey2026!'),
        ]);

        $label = $owner->labels()->create(['name' => 'Internal Tag', 'color' => '#3b82f6']);
        $note->labels()->attach($label->id);

        NoteShare::create([
            'note_id' => $note->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
        ]);

        $res = $this->actingAs($recipient)->getJson('/api/shared-notes');
        $res->assertOk();

        $rawContent = $res->getContent();
        $this->assertStringNotContainsString('Internal Tag', $rawContent);
        $this->assertStringNotContainsString('protection_password_hash', $rawContent);
        $this->assertStringNotContainsString('VaultKey2026!', $rawContent);
    }

    public function test_multiple_shares_have_deterministic_descending_order(): void
    {
        $owner = $this->createUser();
        $recipient = $this->createUser();

        $note1 = Note::factory()->create(['user_id' => $owner->id, 'title' => 'First Note']);
        $note2 = Note::factory()->create(['user_id' => $owner->id, 'title' => 'Second Note']);
        $note3 = Note::factory()->create(['user_id' => $owner->id, 'title' => 'Third Note']);

        $share1 = NoteShare::create([
            'note_id' => $note1->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
            'created_at' => now()->subMinutes(10),
        ]);

        $share2 = NoteShare::create([
            'note_id' => $note2->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'edit',
            'created_at' => now()->subMinutes(5),
        ]);

        $share3 = NoteShare::create([
            'note_id' => $note3->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => 'read',
            'created_at' => now(),
        ]);

        $res = $this->actingAs($recipient)->getJson('/api/shared-notes');
        $res->assertOk();
        $res->assertJsonCount(3, 'data');

        // Order: newest share first (share3, share2, share1)
        $res->assertJsonPath('data.0.share_id', $share3->id);
        $res->assertJsonPath('data.1.share_id', $share2->id);
        $res->assertJsonPath('data.2.share_id', $share1->id);
    }
}
