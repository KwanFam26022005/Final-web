<?php

namespace Tests\Feature;

use App\Models\Label;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LabelTest extends TestCase
{
    use RefreshDatabase;

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    // ==========================================
    // LABEL CRUD & SECURITY (LABEL-01)
    // ==========================================

    public function test_anonymous_user_cannot_access_label_endpoints(): void
    {
        $label = Label::factory()->create();

        $this->getJson('/api/labels')->assertUnauthorized();
        $this->postJson('/api/labels', ['name' => 'Work'])->assertUnauthorized();
        $this->patchJson("/api/labels/{$label->id}", ['name' => 'Work'])->assertUnauthorized();
        $this->deleteJson("/api/labels/{$label->id}")->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_only_own_labels_alphabetically(): void
    {
        $user = $this->authenticatedUser();
        $otherUser = User::factory()->create();

        Label::factory()->create(['user_id' => $user->id, 'name' => 'Physics']);
        Label::factory()->create(['user_id' => $user->id, 'name' => 'Chemistry']);
        Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'Biology']);

        $response = $this->getJson('/api/labels');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Chemistry')
            ->assertJsonPath('data.1.name', 'Physics');
    }

    public function test_authenticated_user_can_create_label(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/labels', [
            'name' => 'Research Project',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'created_at', 'updated_at'],
            ])
            ->assertJsonPath('data.name', 'Research Project');

        $this->assertDatabaseHas('labels', [
            'name' => 'Research Project',
        ]);
    }

    public function test_ownership_assigned_server_side_and_client_user_id_ignored(): void
    {
        $user = $this->authenticatedUser();
        $otherUser = User::factory()->create();

        $response = $this->postJson('/api/labels', [
            'name' => 'Academic Papers',
            'user_id' => $otherUser->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('labels', [
            'name' => 'Academic Papers',
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseMissing('labels', [
            'name' => 'Academic Papers',
            'user_id' => $otherUser->id,
        ]);
    }

    public function test_empty_label_name_rejected_with_422(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/labels', [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_whitespace_label_name_rejected_with_422(): void
    {
        $this->authenticatedUser();

        $response = $this->postJson('/api/labels', [
            'name' => '     ',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_label_max_length_enforced(): void
    {
        $this->authenticatedUser();

        // 50 characters succeeds
        $validName = str_repeat('a', 50);
        $this->postJson('/api/labels', ['name' => $validName])
            ->assertCreated();

        // 51 characters fails
        $invalidName = str_repeat('b', 51);
        $this->postJson('/api/labels', ['name' => $invalidName])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_duplicate_label_name_same_user_rejected_with_422(): void
    {
        $user = $this->authenticatedUser();
        Label::factory()->create(['user_id' => $user->id, 'name' => 'Study']);

        $response = $this->postJson('/api/labels', [
            'name' => 'Study',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_case_variant_duplicate_same_user_rejected_under_db_contract(): void
    {
        $user = $this->authenticatedUser();
        Label::factory()->create(['user_id' => $user->id, 'name' => 'Study']);

        $response = $this->postJson('/api/labels', [
            'name' => 'study',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_different_users_may_share_same_label_name(): void
    {
        $userA = $this->authenticatedUser();
        $userB = User::factory()->create();

        Label::factory()->create(['user_id' => $userB->id, 'name' => 'Study']);

        $response = $this->postJson('/api/labels', [
            'name' => 'Study',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('labels', ['user_id' => $userA->id, 'name' => 'Study']);
        $this->assertDatabaseHas('labels', ['user_id' => $userB->id, 'name' => 'Study']);
    }

    public function test_owner_can_rename_label(): void
    {
        $user = $this->authenticatedUser();
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Drafts']);

        $response = $this->patchJson("/api/labels/{$label->id}", [
            'name' => 'Finalized',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Finalized');

        $this->assertDatabaseHas('labels', [
            'id' => $label->id,
            'name' => 'Finalized',
        ]);
    }

    public function test_rename_whitespace_or_empty_rejected(): void
    {
        $user = $this->authenticatedUser();
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Active']);

        $this->patchJson("/api/labels/{$label->id}", ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->patchJson("/api/labels/{$label->id}", ['name' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_duplicate_rename_rejected_with_422(): void
    {
        $user = $this->authenticatedUser();
        Label::factory()->create(['user_id' => $user->id, 'name' => 'Math']);
        $science = Label::factory()->create(['user_id' => $user->id, 'name' => 'Science']);

        // Renaming to existing label name fails
        $this->patchJson("/api/labels/{$science->id}", ['name' => 'Math'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        // Renaming to its own existing name succeeds
        $this->patchJson("/api/labels/{$science->id}", ['name' => 'Science'])
            ->assertOk();
    }

    public function test_foreign_rename_forbidden_with_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $label = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'Secret']);

        $this->patchJson("/api/labels/{$label->id}", [
            'name' => 'Hacked',
        ])->assertForbidden();
    }

    public function test_owner_can_delete_label(): void
    {
        $user = $this->authenticatedUser();
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Obsolete']);

        $response = $this->deleteJson("/api/labels/{$label->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Label deleted successfully.');

        $this->assertDatabaseMissing('labels', [
            'id' => $label->id,
        ]);
    }

    public function test_foreign_delete_forbidden_with_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $label = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'Private']);

        $this->deleteJson("/api/labels/{$label->id}")
            ->assertForbidden();
    }

    public function test_delete_label_does_not_delete_notes(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id, 'title' => 'Important Note']);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'TagToDelete']);

        $note->labels()->attach($label->id);

        $this->deleteJson("/api/labels/{$label->id}")->assertOk();

        $this->assertDatabaseMissing('labels', ['id' => $label->id]);
        $this->assertDatabaseHas('notes', ['id' => $note->id, 'title' => 'Important Note']);
    }

    public function test_delete_label_cascades_pivot_associations(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Temporary']);

        $note->labels()->attach($label->id);
        $this->assertDatabaseHas('note_label', ['note_id' => $note->id, 'label_id' => $label->id]);

        $this->deleteJson("/api/labels/{$label->id}")->assertOk();

        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $label->id]);
    }

    // ==========================================
    // NOTE LABEL ASSIGNMENT (LABEL-02)
    // ==========================================

    public function test_owner_syncs_one_label_to_own_note(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'University']);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$label->id],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'data.labels')
            ->assertJsonPath('data.labels.0.id', $label->id)
            ->assertJsonPath('data.labels.0.name', 'University');

        $this->assertDatabaseHas('note_label', [
            'note_id' => $note->id,
            'label_id' => $label->id,
        ]);
    }

    public function test_owner_syncs_multiple_labels(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $label1 = Label::factory()->create(['user_id' => $user->id, 'name' => 'Exam']);
        $label2 = Label::factory()->create(['user_id' => $user->id, 'name' => 'CS']);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$label1->id, $label2->id],
        ]);

        $response->assertOk()
            ->assertJsonCount(2, 'data.labels');

        $this->assertDatabaseHas('note_label', ['note_id' => $note->id, 'label_id' => $label1->id]);
        $this->assertDatabaseHas('note_label', ['note_id' => $note->id, 'label_id' => $label2->id]);
    }

    public function test_sync_replaces_old_set(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $labelOld = Label::factory()->create(['user_id' => $user->id, 'name' => 'Old']);
        $labelNew = Label::factory()->create(['user_id' => $user->id, 'name' => 'New']);

        $note->labels()->attach($labelOld->id);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$labelNew->id],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'data.labels')
            ->assertJsonPath('data.labels.0.name', 'New');

        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $labelOld->id]);
        $this->assertDatabaseHas('note_label', ['note_id' => $note->id, 'label_id' => $labelNew->id]);
    }

    public function test_empty_array_removes_all_labels(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'ClearMe']);

        $note->labels()->attach($label->id);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [],
        ]);

        $response->assertOk()
            ->assertJsonCount(0, 'data.labels');

        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $label->id]);
    }

    public function test_duplicate_label_ids_in_sync_rejected_with_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'UniqueTag']);

        $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$label->id, $label->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['label_ids.0']);
    }

    public function test_foreign_note_cannot_be_relabeled_403(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id]);
        $foreignLabel = Label::factory()->create(['user_id' => $otherUser->id]);

        $this->putJson("/api/notes/{$foreignNote->id}/labels", [
            'label_ids' => [$foreignLabel->id],
        ])->assertForbidden();
    }

    public function test_foreign_label_cannot_be_attached_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $otherUser = User::factory()->create();
        $foreignLabel = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'ForeignLabel']);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$foreignLabel->id],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['label_ids']);

        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $foreignLabel->id]);
    }

    public function test_mixed_own_and_foreign_labels_rejected_atomically_with_422(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $ownLabel = Label::factory()->create(['user_id' => $user->id, 'name' => 'OwnLabel']);
        $otherUser = User::factory()->create();
        $foreignLabel = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'ForeignLabel']);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$ownLabel->id, $foreignLabel->id],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['label_ids']);

        // Atomic invariant: own label must NOT be attached on partial/mixed failure
        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $ownLabel->id]);
        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $foreignLabel->id]);
    }

    public function test_invalid_nonexistent_label_id_does_not_partially_mutate(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $ownLabel = Label::factory()->create(['user_id' => $user->id, 'name' => 'GoodLabel']);

        $response = $this->putJson("/api/notes/{$note->id}/labels", [
            'label_ids' => [$ownLabel->id, 999999],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['label_ids']);

        $this->assertDatabaseMissing('note_label', ['note_id' => $note->id, 'label_id' => $ownLabel->id]);
    }

    public function test_note_resource_includes_labels_correctly_on_show_and_index(): void
    {
        $user = $this->authenticatedUser();
        $note = Note::factory()->create(['user_id' => $user->id, 'title' => 'Biology 101']);
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Science']);
        $note->labels()->attach($label->id);

        // Show endpoint
        $showRes = $this->getJson("/api/notes/{$note->id}");
        $showRes->assertOk()
            ->assertJsonPath('data.labels.0.id', $label->id)
            ->assertJsonPath('data.labels.0.name', 'Science');

        // Index endpoint
        $indexRes = $this->getJson('/api/notes');
        $indexRes->assertOk()
            ->assertJsonPath('data.0.labels.0.id', $label->id)
            ->assertJsonPath('data.0.labels.0.name', 'Science');
    }

    // ==========================================
    // LABEL FILTERING (LABEL-03)
    // ==========================================

    public function test_filter_notes_by_single_label(): void
    {
        $user = $this->authenticatedUser();
        $label1 = Label::factory()->create(['user_id' => $user->id, 'name' => 'Uni']);
        $label2 = Label::factory()->create(['user_id' => $user->id, 'name' => 'Work']);

        $noteA = Note::factory()->create(['user_id' => $user->id, 'title' => 'Uni Note']);
        $noteB = Note::factory()->create(['user_id' => $user->id, 'title' => 'Work Note']);
        $noteC = Note::factory()->create(['user_id' => $user->id, 'title' => 'No Tag Note']);

        $noteA->labels()->attach($label1->id);
        $noteB->labels()->attach($label2->id);

        $response = $this->getJson("/api/notes?label_ids[]={$label1->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $noteA->id);
    }

    public function test_filter_notes_by_multiple_labels_with_all_match_semantics(): void
    {
        $user = $this->authenticatedUser();
        $label1 = Label::factory()->create(['user_id' => $user->id, 'name' => 'Research']);
        $label2 = Label::factory()->create(['user_id' => $user->id, 'name' => 'University']);

        $noteBoth = Note::factory()->create(['user_id' => $user->id, 'title' => 'Both Labels Note']);
        $noteOnly1 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Only Label 1']);
        $noteOnly2 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Only Label 2']);
        $noteNeither = Note::factory()->create(['user_id' => $user->id, 'title' => 'Neither Label']);

        $noteBoth->labels()->attach([$label1->id, $label2->id]);
        $noteOnly1->labels()->attach($label1->id);
        $noteOnly2->labels()->attach($label2->id);

        $response = $this->getJson("/api/notes?label_ids[]={$label1->id}&label_ids[]={$label2->id}");

        // Strict ALL-match: only note with BOTH labels matches!
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $noteBoth->id);
    }

    public function test_matching_note_with_multiple_labels_returned_once_without_duplicates(): void
    {
        $user = $this->authenticatedUser();
        $label1 = Label::factory()->create(['user_id' => $user->id, 'name' => 'L1']);
        $label2 = Label::factory()->create(['user_id' => $user->id, 'name' => 'L2']);
        $label3 = Label::factory()->create(['user_id' => $user->id, 'name' => 'L3']);

        $note = Note::factory()->create(['user_id' => $user->id, 'title' => 'Multi-label note']);
        $note->labels()->attach([$label1->id, $label2->id, $label3->id]);

        $response = $this->getJson("/api/notes?label_ids[]={$label1->id}&label_ids[]={$label2->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $note->id);
    }

    public function test_foreign_users_notes_excluded_when_filtering_by_label(): void
    {
        $user = $this->authenticatedUser();
        $otherUser = User::factory()->create();

        $ownLabel = Label::factory()->create(['user_id' => $user->id, 'name' => 'Tag']);
        $foreignLabel = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'Tag']);

        $ownNote = Note::factory()->create(['user_id' => $user->id, 'title' => 'Own Note']);
        $foreignNote = Note::factory()->create(['user_id' => $otherUser->id, 'title' => 'Foreign Note']);

        $ownNote->labels()->attach($ownLabel->id);
        $foreignNote->labels()->attach($foreignLabel->id);

        $response = $this->getJson("/api/notes?label_ids[]={$ownLabel->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownNote->id);
    }

    public function test_foreign_label_filter_ids_rejected_safely_returning_empty_collection(): void
    {
        $this->authenticatedUser();
        $otherUser = User::factory()->create();
        $foreignLabel = Label::factory()->create(['user_id' => $otherUser->id, 'name' => 'ForeignTag']);

        $response = $this->getJson("/api/notes?label_ids[]={$foreignLabel->id}");

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_text_and_single_label_composition(): void
    {
        $user = $this->authenticatedUser();
        $math = Label::factory()->create(['user_id' => $user->id, 'name' => 'Math']);
        $physics = Label::factory()->create(['user_id' => $user->id, 'name' => 'Physics']);

        $note1 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Linear Algebra Equations']);
        $note2 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Linear Algebra Mechanics']);
        $note3 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Quantum Mechanics']);

        $note1->labels()->attach($math->id);
        $note2->labels()->attach($physics->id);
        $note3->labels()->attach($physics->id);

        // Search "Linear" AND Label "Physics" -> Only note 2 matches
        $response = $this->getJson("/api/notes?q=Linear&label_ids[]={$physics->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $note2->id);
    }

    public function test_search_text_and_multiple_labels_composition(): void
    {
        $user = $this->authenticatedUser();
        $cs = Label::factory()->create(['user_id' => $user->id, 'name' => 'CS']);
        $exam = Label::factory()->create(['user_id' => $user->id, 'name' => 'Exam']);

        $note1 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Algorithms Prep']);
        $note2 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Algorithms Overview']);
        $note3 = Note::factory()->create(['user_id' => $user->id, 'title' => 'Database Prep']);

        $note1->labels()->attach([$cs->id, $exam->id]);
        $note2->labels()->attach([$cs->id]);
        $note3->labels()->attach([$cs->id, $exam->id]);

        // Search "Algorithms" AND Labels [CS, Exam] -> Only note 1 satisfies all
        $response = $this->getJson("/api/notes?q=Algorithms&label_ids[]={$cs->id}&label_ids[]={$exam->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $note1->id);
    }

    public function test_pin_ordering_preserved_after_label_filtering(): void
    {
        $user = $this->authenticatedUser();
        $label = Label::factory()->create(['user_id' => $user->id, 'name' => 'Academic']);

        $unpinned = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Unpinned Note',
            'is_pinned' => false,
            'updated_at' => now(),
        ]);

        $pinned = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Pinned Note',
            'is_pinned' => true,
            'updated_at' => now()->subMinutes(10),
        ]);

        $unpinned->labels()->attach($label->id);
        $pinned->labels()->attach($label->id);

        $response = $this->getJson("/api/notes?label_ids[]={$label->id}");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $pinned->id)
            ->assertJsonPath('data.1.id', $unpinned->id);
    }

    public function test_empty_label_filter_behaves_as_normal_list(): void
    {
        $user = $this->authenticatedUser();
        Note::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/notes?label_ids=');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }
}
