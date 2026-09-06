<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\DatabaseTestCase;

class AttachmentTest extends DatabaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    // ==========================================
    // ANONYMOUS & AUTHORIZATION CHECKS
    // ==========================================

    public function test_anonymous_user_cannot_access_attachment_endpoints(): void
    {
        $note = Note::factory()->create();
        $attachment = Attachment::factory()->create(['note_id' => $note->id]);

        $this->getJson("/api/notes/{$note->id}/attachments")->assertUnauthorized();
        $this->postJson("/api/notes/{$note->id}/attachments")->assertUnauthorized();
        $this->getJson("/api/attachments/{$attachment->id}/content")->assertUnauthorized();
        $this->getJson("/api/attachments/{$attachment->id}/download")->assertUnauthorized();
        $this->deleteJson("/api/attachments/{$attachment->id}")->assertUnauthorized();
    }

    public function test_cannot_upload_attachment_to_foreign_note_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->postJson("/api/notes/{$foreignNote->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertForbidden();
    }

    // ==========================================
    // UPLOAD CONTRACT & VALIDATION (SEC-04, NOTE-08)
    // ==========================================

    public function test_owner_can_upload_jpeg_attachment(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('photo.jpg', 600, 400);

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'photo.jpg')
            ->assertJsonPath('data.mime_type', 'image/jpeg');

        $this->assertDatabaseHas('attachments', [
            'note_id' => $note->id,
            'original_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
        ]);
    }

    public function test_owner_can_upload_png_attachment(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('diagram.png', 400, 400);

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'diagram.png')
            ->assertJsonPath('data.mime_type', 'image/png');
    }

    public function test_owner_can_upload_webp_attachment(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('banner.webp', 800, 600);

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'banner.webp')
            ->assertJsonPath('data.mime_type', 'image/webp');
    }

    public function test_owner_can_upload_pdf_attachment(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('report.pdf', 250, 'application/pdf');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'report.pdf')
            ->assertJsonPath('data.mime_type', 'application/pdf');
    }

    public function test_valid_upload_persists_metadata_and_stores_file_on_private_disk(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('syllabus.pdf', 120, 'application/pdf');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated();

        $attachmentId = $response->json('data.id');
        $attachment = Attachment::findOrFail($attachmentId);

        // Path must be server-generated random UUID, NOT original name
        $this->assertNotEquals('syllabus.pdf', $attachment->path);
        $this->assertStringStartsWith("attachments/{$note->id}/", $attachment->path);
        $this->assertStringEndsWith('.pdf', $attachment->path);

        // File must exist on private local disk
        Storage::disk('local')->assertExists($attachment->path);
    }

    public function test_resource_does_not_expose_internal_path(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('notes.pdf', 50, 'application/pdf');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated();
        $data = $response->json('data');

        $this->assertArrayNotHasKey('path', $data);
        $this->assertArrayNotHasKey('storage_path', $data);
        $this->assertArrayNotHasKey('disk', $data);
    }

    public function test_oversized_file_exceeding_10mb_rejected_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        // 10241 KB = 10MB + 1KB
        $oversized = UploadedFile::fake()->create('huge.pdf', 10241, 'application/pdf');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $oversized,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_svg_file_rejected_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $svgFile = UploadedFile::fake()->create('vector.svg', 10, 'image/svg+xml');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $svgFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_html_file_rejected_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $htmlFile = UploadedFile::fake()->create('index.html', 10, 'text/html');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $htmlFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_unsupported_mime_rejected_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $script = UploadedFile::fake()->create('script.sh', 10, 'text/x-shellscript');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $script,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_hostile_filename_sanitized_for_display_without_path_traversal(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->create('../../../../etc/passwd.pdf', 50, 'application/pdf');

        $response = $this->postJson("/api/notes/{$note->id}/attachments", [
            'file' => $file,
        ]);

        $response->assertCreated();

        $attachmentId = $response->json('data.id');
        $attachment = Attachment::findOrFail($attachmentId);

        // Display name stripped of path traversal
        $this->assertEquals('passwd.pdf', $attachment->original_name);
        // Stored path remains isolated under attachments/{note_id}/
        $this->assertStringStartsWith("attachments/{$note->id}/", $attachment->path);
        Storage::disk('local')->assertExists($attachment->path);
    }

    // ==========================================
    // READ / LIST / STREAM / DOWNLOAD CONTRACT
    // ==========================================

    public function test_owner_can_list_attachments_ordered_by_created_at_asc(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $att1 = Attachment::factory()->create([
            'note_id' => $note->id,
            'original_name' => 'first.pdf',
            'created_at' => now()->subMinutes(5),
        ]);
        $att2 = Attachment::factory()->create([
            'note_id' => $note->id,
            'original_name' => 'second.png',
            'created_at' => now(),
        ]);

        $response = $this->getJson("/api/notes/{$note->id}/attachments");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $att1->id)
            ->assertJsonPath('data.1.id', $att2->id);

        $this->assertArrayNotHasKey('path', $response->json('data.0'));
    }

    public function test_foreign_user_cannot_list_attachments_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->getJson("/api/notes/{$foreignNote->id}/attachments");
        $response->assertForbidden();
    }

    public function test_owner_can_stream_attachment_content(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $storedPath = "attachments/{$note->id}/test-image.jpg";
        Storage::disk('local')->put($storedPath, 'fake-jpeg-content');

        $attachment = Attachment::factory()->create([
            'note_id' => $note->id,
            'original_name' => 'sample.jpg',
            'path' => $storedPath,
            'mime_type' => 'image/jpeg',
            'size_bytes' => 17,
        ]);

        $response = $this->get("/api/attachments/{$attachment->id}/content");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/jpeg');
        $this->assertStringContainsString('inline', $response->headers->get('Content-Disposition') ?? '');
    }

    public function test_owner_can_download_attachment(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $storedPath = "attachments/{$note->id}/test-doc.pdf";
        Storage::disk('local')->put($storedPath, 'fake-pdf-content');

        $attachment = Attachment::factory()->create([
            'note_id' => $note->id,
            'original_name' => 'document.pdf',
            'path' => $storedPath,
            'mime_type' => 'application/pdf',
            'size_bytes' => 16,
        ]);

        $response = $this->get("/api/attachments/{$attachment->id}/download");

        $response->assertOk();
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition') ?? '');
        $this->assertStringContainsString('document.pdf', $response->headers->get('Content-Disposition') ?? '');
    }

    public function test_foreign_user_cannot_stream_or_download_attachment_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $storedPath = "attachments/{$foreignNote->id}/secret.pdf";
        Storage::disk('local')->put($storedPath, 'secret-content');

        $attachment = Attachment::factory()->create([
            'note_id' => $foreignNote->id,
            'original_name' => 'secret.pdf',
            'path' => $storedPath,
        ]);

        $this->get("/api/attachments/{$attachment->id}/content")->assertForbidden();
        $this->get("/api/attachments/{$attachment->id}/download")->assertForbidden();
    }

    public function test_missing_physical_file_handled_safely_returning_404_without_leaking_path(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $attachment = Attachment::factory()->create([
            'note_id' => $note->id,
            'path' => "attachments/{$note->id}/nonexistent.pdf",
        ]);

        $response = $this->get("/api/attachments/{$attachment->id}/content");
        $response->assertNotFound();
        $this->assertStringNotContainsString('attachments/', $response->getContent() ?: '');
    }

    // ==========================================
    // DELETE & CLEANUP TESTS
    // ==========================================

    public function test_owner_can_delete_attachment_removing_record_and_private_file(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $storedPath = "attachments/{$note->id}/to-delete.pdf";
        Storage::disk('local')->put($storedPath, 'content');

        $attachment = Attachment::factory()->create([
            'note_id' => $note->id,
            'path' => $storedPath,
        ]);

        Storage::disk('local')->assertExists($storedPath);

        $response = $this->deleteJson("/api/attachments/{$attachment->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('attachments', ['id' => $attachment->id]);
        Storage::disk('local')->assertMissing($storedPath);
    }

    public function test_foreign_user_cannot_delete_attachment_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $storedPath = "attachments/{$foreignNote->id}/protected.pdf";
        Storage::disk('local')->put($storedPath, 'content');

        $attachment = Attachment::factory()->create([
            'note_id' => $foreignNote->id,
            'path' => $storedPath,
        ]);

        $response = $this->deleteJson("/api/attachments/{$attachment->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('attachments', ['id' => $attachment->id]);
        Storage::disk('local')->assertExists($storedPath);
    }

    public function test_deleting_attachment_does_not_delete_parent_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id, 'title' => 'Persistent Note']);

        $storedPath = "attachments/{$note->id}/file.pdf";
        Storage::disk('local')->put($storedPath, 'content');

        $attachment = Attachment::factory()->create([
            'note_id' => $note->id,
            'path' => $storedPath,
        ]);

        $this->deleteJson("/api/attachments/{$attachment->id}")->assertNoContent();

        $this->assertDatabaseMissing('attachments', ['id' => $attachment->id]);
        $this->assertDatabaseHas('notes', ['id' => $note->id, 'title' => 'Persistent Note']);
    }

    public function test_deleting_note_cleans_up_all_physical_attachment_files(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $path1 = "attachments/{$note->id}/doc1.pdf";
        $path2 = "attachments/{$note->id}/doc2.png";
        Storage::disk('local')->put($path1, 'content 1');
        Storage::disk('local')->put($path2, 'content 2');

        Attachment::factory()->create([
            'note_id' => $note->id,
            'path' => $path1,
        ]);
        Attachment::factory()->create([
            'note_id' => $note->id,
            'path' => $path2,
        ]);

        Storage::disk('local')->assertExists($path1);
        Storage::disk('local')->assertExists($path2);

        // Delete note via API endpoint
        $response = $this->deleteJson("/api/notes/{$note->id}");
        $response->assertNoContent();

        // Both DB records must be deleted (via cascade)
        $this->assertDatabaseCount('attachments', 0);
        // Both physical files must be removed from private storage
        Storage::disk('local')->assertMissing($path1);
        Storage::disk('local')->assertMissing($path2);
    }
}
