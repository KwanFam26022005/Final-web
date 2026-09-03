<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\DatabaseTestCase;

class EmailVerificationTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_registration_dispatches_registered_event(): void
    {
        Event::fake([Registered::class]);

        $payload = [
            'display_name' => 'Verify User',
            'email' => 'verify@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201);
        Event::assertDispatched(Registered::class, function (Registered $event) {
            return $event->user->email === 'verify@example.com';
        });
    }

    public function test_new_user_starts_unverified_and_retains_authenticated_access(): void
    {
        $user = User::factory()->unverified()->create();

        $this->assertFalse($user->hasVerifiedEmail());
        $this->assertNull($user->email_verified_at);

        // Unverified user MUST retain normal authenticated application access
        $response = $this->actingAs($user)->getJson('/api/auth/user');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'email_verified_at' => null,
                ],
            ]);
    }

    public function test_valid_signed_verification_url_succeeds_and_verifies_account(): void
    {
        $user = User::factory()->unverified()->create();

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->actingAs($user)->getJson($signedUrl);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Email verified successfully.',
            ]);

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_invalid_signature_is_rejected_with_403(): void
    {
        $user = User::factory()->unverified()->create();

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        // Tamper with URL signature
        $tamperedUrl = $signedUrl.'&tampered=1';

        $response = $this->actingAs($user)->getJson($tamperedUrl);

        $response->assertStatus(403);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_already_verified_account_handled_gracefully(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->actingAs($user)->getJson($signedUrl);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Email already verified.',
            ]);
    }

    public function test_verification_resend_dispatches_notification(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->postJson('/api/auth/email/resend');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Verification link sent.',
            ]);

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_verification_resend_when_already_verified_does_not_resend(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/email/resend');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Email already verified.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_verification_resend_is_rate_limited(): void
    {
        $user = User::factory()->unverified()->create();

        // Limit is 5 requests per minute
        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->postJson('/api/auth/email/resend')->assertStatus(200);
        }

        // 6th request must be throttled with HTTP 429
        $response = $this->actingAs($user)->postJson('/api/auth/email/resend');
        $response->assertStatus(429);
    }
}
