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
        $this->deleteJson('/api/notes/1')->assertUnauthorized();
    }

    // --- DESTROY ---

    public function test_authenticated_user_can_delete_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/api/notes/{$note->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    public function test_delete_returns_204_no_content_with_empty_body(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/api/notes/{$note->id}");

        $response->assertStatus(204);
        $this->assertEmpty($response->getContent());
    }

    public function test_user_cannot_delete_another_users_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->create([
            'user_id' => $other->id,
            'title' => 'Secret Note',
            'content' => 'Secret Content',
        ]);

        $response = $this->deleteJson("/api/notes/{$note->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Secret Note',
            'content' => 'Secret Content',
        ]);
    }

    public function test_delete_nonexistent_note_returns_404(): void
    {
        $this->authenticatedUser();

        $response = $this->deleteJson('/api/notes/999999');

        $response->assertNotFound();
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

    public function test_note_resource_exposes_is_pinned_boolean(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id, 'is_pinned' => true]);

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertArrayNotHasKey('user_id', $data);
        $this->assertArrayHasKey('is_pinned', $data);
        $this->assertTrue($data['is_pinned']);
    }

    // --- PINNING (NOTE-06) ---

    public function test_owner_can_pin_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id, 'is_pinned' => false]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('data.is_pinned'));
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => 1,
        ]);
    }

    public function test_owner_can_unpin_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->pinned()->create(['user_id' => $user->id]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => false,
        ]);

        $response->assertOk();
        $this->assertFalse($response->json('data.is_pinned'));
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => 0,
        ]);
    }

    public function test_pin_endpoint_validates_boolean(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->patchJson("/api/notes/{$note->id}/pin", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['is_pinned']);

        $this->patchJson("/api/notes/{$note->id}/pin", ['is_pinned' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['is_pinned']);
    }

    public function test_foreign_user_cannot_pin_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $other->id, 'is_pinned' => false]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => 0,
        ]);
    }

    public function test_foreign_user_cannot_unpin_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        $note = Note::factory()->pinned()->create(['user_id' => $other->id]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => false,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => 1,
        ]);
    }

    public function test_anonymous_cannot_pin_note(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ]);

        $response->assertUnauthorized();
    }

    public function test_pin_response_contains_is_pinned(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'title', 'content', 'is_pinned', 'created_at', 'updated_at'],
            ]);
    }

    public function test_existing_note_default_is_pinned_is_false(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->assertFalse($note->is_pinned);
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => 0,
        ]);
    }

    public function test_pin_does_not_mutate_title_or_content(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
            'is_pinned' => false,
        ]);

        $response = $this->patchJson("/api/notes/{$note->id}/pin", [
            'is_pinned' => true,
        ]);

        $response->assertOk();
        $this->assertSame('Original Title', $response->json('data.title'));
        $this->assertSame('Original Content', $response->json('data.content'));
        $this->assertTrue($response->json('data.is_pinned'));

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Original Title',
            'content' => 'Original Content',
            'is_pinned' => 1,
        ]);
    }

    public function test_pinned_notes_ordered_before_unpinned_notes(): void
    {
        $user = $this->authenticatedUser();

        $unpinned = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Unpinned Newer',
            'is_pinned' => false,
            'updated_at' => now(),
        ]);

        $pinned = Note::factory()->pinned()->create([
            'user_id' => $user->id,
            'title' => 'Pinned Older',
            'updated_at' => now()->subMinutes(10),
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertOk();
        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$pinned->id, $unpinned->id], $ids);
    }

    // --- LIVE SEARCH (NOTE-07) ---

    public function test_get_notes_without_q_returns_normal_own_notes(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/notes');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_search_matches_title(): void
    {
        $user = $this->authenticatedUser();
        $match = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Linear Algebra Study Notes',
            'content' => 'Vector spaces and matrices',
        ]);
        Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Organic Chemistry',
            'content' => 'Hydrocarbons and synthesis',
        ]);

        $response = $this->getJson('/api/notes?q=algebra');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($match->id, $response->json('data.0.id'));
    }

    public function test_search_matches_content(): void
    {
        $user = $this->authenticatedUser();
        $match = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Physics Notes',
            'content' => 'Discussion on quantum mechanics and particles',
        ]);
        Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'European History',
            'content' => 'Industrial revolution overview',
        ]);

        $response = $this->getJson('/api/notes?q=quantum');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($match->id, $response->json('data.0.id'));
    }

    public function test_search_is_case_insensitive(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Database Systems',
            'content' => 'ACID transactions and B-Trees',
        ]);

        $response = $this->getJson('/api/notes?q=DATABASE');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($note->id, $response->json('data.0.id'));
    }

    public function test_search_excludes_nonmatching_notes(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Discrete Math',
            'content' => 'Graphs and trees',
        ]);

        $response = $this->getJson('/api/notes?q=nonexistentqueryxyz');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_never_returns_another_users_note(): void
    {
        $this->authenticatedUser();
        $other = User::factory()->create();
        Note::factory()->create([
            'user_id' => $other->id,
            'title' => 'Top Secret Roadmap',
            'content' => 'Internal confidential data',
        ]);

        $response = $this->getJson('/api/notes?q=Secret');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_query_is_ownership_scoped(): void
    {
        $user = $this->authenticatedUser();
        $other = User::factory()->create();

        $ownNote = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Algorithms & Complexity',
            'content' => 'Big-O notation',
        ]);
        Note::factory()->create([
            'user_id' => $other->id,
            'title' => 'Algorithms in Python',
            'content' => 'Sorting routines',
        ]);

        $response = $this->getJson('/api/notes?q=Algorithms');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($ownNote->id, $response->json('data.0.id'));
    }

    public function test_empty_q_behaves_as_normal_list(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/notes?q=');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_whitespace_q_behaves_as_normal_list(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/notes?q=%20%20%20');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_special_like_characters_do_not_broaden_result_set(): void
    {
        $user = $this->authenticatedUser();

        $literalPercent = Note::factory()->create([
            'user_id' => $user->id,
            'title' => '100% Guaranteed',
            'content' => 'Grade A rating',
        ]);
        Note::factory()->create([
            'user_id' => $user->id,
            'title' => '1000 Guaranteed',
            'content' => 'Grade B rating',
        ]);

        // Search for '100%' — should only match $literalPercent
        $response = $this->getJson('/api/notes?q=100%25');
        $response->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($literalPercent->id, $response->json('data.0.id'));

        $literalUnderscore = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'test_note',
            'content' => 'some content',
        ]);
        Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'testxnote',
            'content' => 'other content',
        ]);

        // Search for 'test_' — should only match $literalUnderscore
        $response2 = $this->getJson('/api/notes?q=test_');
        $response2->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame($literalUnderscore->id, $response2->json('data.0.id'));
    }

    public function test_long_invalid_query_rejected(): void
    {
        $this->authenticatedUser();
        $longQuery = str_repeat('a', 201);

        $response = $this->getJson("/api/notes?q={$longQuery}");

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['q']);
    }

    public function test_search_preserves_pinned_first_ordering(): void
    {
        $user = $this->authenticatedUser();

        $unpinned = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Algorithm Lab Unpinned',
            'is_pinned' => false,
            'updated_at' => now(),
        ]);

        $pinned = Note::factory()->pinned()->create([
            'user_id' => $user->id,
            'title' => 'Algorithm Lecture Pinned',
            'updated_at' => now()->subMinutes(10),
        ]);

        $response = $this->getJson('/api/notes?q=Algorithm');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$pinned->id, $unpinned->id], $ids);
    }
}
