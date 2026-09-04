<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    // --- INDEX ---

    public function test_authenticated_user_can_list_own_notes(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/notes');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_list_excludes_other_users_notes(): void
    {
        $user = $this->authenticatedUser();
        $other = User::factory()->create();

        Note::factory()->count(2)->create(['user_id' => $user->id]);
        Note::factory()->count(3)->create(['user_id' => $other->id]);

        $response = $this->getJson('/api/notes');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_notes_ordered_by_most_recently_updated(): void
    {
        $user = $this->authenticatedUser();

        $older = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Older',
            'updated_at' => now()->subMinutes(5),
        ]);
        $newer = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Newer',
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals($newer->id, $data[0]['id']);
        $this->assertEquals($older->id, $data[1]['id']);
    }

    // --- STORE ---

    public function test_authenticated_user_can_create_note(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/notes', [
            'title' => 'My First Note',
            'content' => 'Hello world content.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'My First Note')
            ->assertJsonPath('data.content', 'Hello world content.')
            ->assertJsonStructure([
                'data' => ['id', 'title', 'content', 'created_at', 'updated_at'],
            ]);
    }

    public function test_client_cannot_assign_arbitrary_user_id(): void
    {
        $user = $this->authenticatedUser();
        $other = User::factory()->create();

        $response = $this->postJson('/api/notes', [
            'title' => 'Hijack attempt',
            'content' => 'Should belong to auth user',
            'user_id' => $other->id,
        ]);

        $response->assertCreated();

        $note = Note::latest('id')->first();
        $this->assertEquals($user->id, $note->user_id);
    }

    public function test_create_note_requires_title(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/notes', [
            'content' => 'Body without title',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_create_note_requires_content(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/notes', [
            'title' => 'Title without body',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_create_note_rejects_whitespace_only_title(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/notes', [
            'title' => '   ',
            'content' => 'Valid content.',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    // --- SHOW ---

    public function test_user_can_read_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $note->id)
            ->assertJsonPath('data.title', $note->title);
    }

    public function test_user_cannot_read_another_users_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $other->id]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertForbidden();
    }

    public function test_idor_does_not_leak_note_content(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->create([
            'user_id' => $other->id,
            'title' => 'Secret Title',
            'content' => 'Secret Content',
        ]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertForbidden();
        $response->assertDontSee('Secret Title');
        $response->assertDontSee('Secret Content');
    }

    // --- UPDATE ---

    public function test_user_can_update_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->patchJson("/api/notes/{$note->id}", [
            'title' => 'Updated Title',
            'content' => 'Updated content body.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.content', 'Updated content body.');

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated Title',
            'content' => 'Updated content body.',
        ]);
    }

    public function test_user_cannot_update_another_users_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $other->id]);

        $response = $this->patchJson("/api/notes/{$note->id}", [
            'title' => 'Hijacked',
        ]);

        $response->assertForbidden();
    }

    public function test_partial_update_preserves_unchanged_fields(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
        ]);

        $response = $this->patchJson("/api/notes/{$note->id}", [
            'title' => 'New Title',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'New Title')
            ->assertJsonPath('data.content', 'Original Content');
    }

    // --- ANONYMOUS ---

    public function test_anonymous_cannot_access_notes_api(): void
    {
        $this->getJson('/api/notes')->assertUnauthorized();
        $this->postJson('/api/notes', ['title' => 'T', 'content' => 'C'])->assertUnauthorized();
    }

    // --- RESOURCE SHAPE ---

    public function test_note_resource_does_not_expose_user_id(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertArrayNotHasKey('user_id', $data);
    }
}
