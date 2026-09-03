<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\DatabaseTestCase;

class UserPreferenceTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_user_preferences_have_safe_default_values(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/account/preferences');

        $response->assertStatus(200)
            ->assertJson([
                'preference' => [
                    'theme' => 'system',
                    'default_note_view' => 'grid',
                ],
            ]);
    }

    public function test_user_can_update_theme_preference(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/account/preferences', [
            'theme' => 'dark',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Preferences updated successfully.',
                'preference' => [
                    'theme' => 'dark',
                    'default_note_view' => 'grid',
                ],
            ]);

        $this->assertEquals('dark', $user->fresh()->preference->theme);
    }

    public function test_user_can_update_default_note_view(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/account/preferences', [
            'default_note_view' => 'list',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'preference' => [
                    'default_note_view' => 'list',
                ],
            ]);

        $this->assertEquals('list', $user->fresh()->preference->default_note_view);
    }

    public function test_invalid_theme_or_note_view_values_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/account/preferences', [
            'theme' => 'neon-party',
            'default_note_view' => 'carousel',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['theme', 'default_note_view']);
    }

    public function test_preference_isolation_between_users(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A sets theme to dark
        $this->actingAs($userA)->patchJson('/api/account/preferences', ['theme' => 'dark'])->assertStatus(200);

        // User B sets theme to light
        $this->actingAs($userB)->patchJson('/api/account/preferences', ['theme' => 'light'])->assertStatus(200);

        // Verify each user has their own preference
        $this->assertEquals('dark', $userA->fresh()->preference->theme);
        $this->assertEquals('light', $userB->fresh()->preference->theme);
    }

    public function test_anonymous_cannot_access_preferences(): void
    {
        $response = $this->getJson('/api/account/preferences');
        $response->assertStatus(401);
    }
}
