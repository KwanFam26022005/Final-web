<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class PasswordChangeTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_correct_current_password_successfully_changes_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CurrentSecret123!'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/password', [
            'current_password' => 'CurrentSecret123!',
            'new_password' => 'UpdatedSecret456!',
            'new_password_confirmation' => 'UpdatedSecret456!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password changed successfully.',
            ]);

        $freshUser = $user->fresh();

        $this->assertFalse(Hash::check('CurrentSecret123!', $freshUser->password));
        $this->assertTrue(Hash::check('UpdatedSecret456!', $freshUser->password));
    }

    public function test_incorrect_current_password_is_rejected_generically(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('RightSecret123!'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/password', [
            'current_password' => 'WrongSecret123!',
            'new_password' => 'NewSecret456!',
            'new_password_confirmation' => 'NewSecret456!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        // Password must remain unchanged
        $this->assertTrue(Hash::check('RightSecret123!', $user->fresh()->password));
    }

    public function test_new_password_must_meet_validation_and_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CurrentSecret123!'),
        ]);

        // Short password and mismatch
        $response = $this->actingAs($user)->postJson('/api/account/password', [
            'current_password' => 'CurrentSecret123!',
            'new_password' => 'short',
            'new_password_confirmation' => 'different',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_new_password_must_differ_from_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CurrentSecret123!'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/password', [
            'current_password' => 'CurrentSecret123!',
            'new_password' => 'CurrentSecret123!',
            'new_password_confirmation' => 'CurrentSecret123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_password_and_hash_never_exposed_in_response(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CurrentSecret123!'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/account/password', [
            'current_password' => 'CurrentSecret123!',
            'new_password' => 'UpdatedSecret456!',
            'new_password_confirmation' => 'UpdatedSecret456!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonMissing(['password']);
        $response->assertJsonMissing(['password_hash']);
    }

    public function test_anonymous_user_cannot_access_password_change(): void
    {
        $response = $this->postJson('/api/account/password', [
            'current_password' => 'SomePass123!',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(401);
    }
}
