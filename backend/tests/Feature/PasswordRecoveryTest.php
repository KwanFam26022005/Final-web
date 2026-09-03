<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\DatabaseTestCase;

class PasswordRecoveryTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_generic_response_and_sends_notification_for_existing_user(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'recoverme@example.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'recoverme@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'If an account exists for this email, a password reset link has been sent.',
            ]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_returns_identical_generic_response_for_nonexistent_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'ghost@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'If an account exists for this email, a password reset link has been sent.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_valid_token_resets_password_and_invalidates_old_password(): void
    {
        $user = User::factory()->create([
            'email' => 'resetuser@example.com',
            'password' => Hash::make('OldSecret123!'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'resetuser@example.com',
            'password' => 'NewSecret456!',
            'password_confirmation' => 'NewSecret456!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password reset successfully. Please log in with your new password.',
            ]);

        $freshUser = $user->fresh();

        // Old password must fail
        $this->assertFalse(Hash::check('OldSecret123!', $freshUser->password));

        // New password must verify
        $this->assertTrue(Hash::check('NewSecret456!', $freshUser->password));
    }

    public function test_reset_password_does_not_automatically_authenticate_user(): void
    {
        $user = User::factory()->create([
            'email' => 'manual_login@example.com',
            'password' => Hash::make('InitialPass123!'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'manual_login@example.com',
            'password' => 'BrandNewPass123!',
            'password_confirmation' => 'BrandNewPass123!',
        ]);

        $response->assertStatus(200);

        // User must remain unauthenticated (contract requires manual login)
        $this->assertGuest();
        $this->getJson('/api/auth/user')->assertStatus(401);
    }

    public function test_invalid_or_expired_token_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'invalidtoken@example.com',
            'password' => Hash::make('CurrentPass123!'),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid-or-fake-token-string',
            'email' => 'invalidtoken@example.com',
            'password' => 'NewAttempt123!',
            'password_confirmation' => 'NewAttempt123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Password must remain unchanged
        $this->assertTrue(Hash::check('CurrentPass123!', $user->fresh()->password));
    }

    public function test_forgot_password_is_rate_limited(): void
    {
        // Limit is 5 requests per minute
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/forgot-password', [
                'email' => 'throttle@example.com',
            ])->assertStatus(200);
        }

        // 6th request must return 429
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'throttle@example.com',
        ]);

        $response->assertStatus(429);
    }
}
