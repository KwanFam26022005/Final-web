<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class AuthTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_registration_succeeds_and_persists_exact_account_data(): void
    {
        $payload = [
            'display_name' => 'Kwan Family',
            'email' => 'kwan@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'display_name',
                    'email',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'message' => 'User registered successfully.',
                'user' => [
                    'display_name' => 'Kwan Family',
                    'email' => 'kwan@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'display_name' => 'Kwan Family',
            'email' => 'kwan@example.com',
        ]);
    }

    public function test_registration_stores_password_as_verified_bcrypt_hash_and_does_not_expose_hash(): void
    {
        $payload = [
            'display_name' => 'Hashing Check',
            'email' => 'hashcheck@example.com',
            'password' => 'SecretPassword99!',
            'password_confirmation' => 'SecretPassword99!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201);
        $response->assertJsonMissing(['password']);
        $response->assertJsonMissing(['password_hash']);

        $user = User::where('email', 'hashcheck@example.com')->firstOrFail();

        // Plaintext is NOT stored
        $this->assertNotEquals('SecretPassword99!', $user->password);

        // Bcrypt hash verification
        $this->assertTrue(Hash::check('SecretPassword99!', $user->password));

        // Bcrypt algorithm verification
        $info = password_get_info($user->password);
        $this->assertEquals('bcrypt', $info['algoName']);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'duplicate@example.com',
        ]);

        $payload = [
            'display_name' => 'Another User',
            'email' => 'duplicate@example.com',
            'password' => 'ValidPass123!',
            'password_confirmation' => 'ValidPass123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_rejects_invalid_payload(): void
    {
        $payload = [
            'display_name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['display_name', 'email', 'password']);
    }

    public function test_successful_registration_automatically_authenticates_user(): void
    {
        $payload = [
            'display_name' => 'Auto Login User',
            'email' => 'autologin@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201);
        $this->assertAuthenticated();
        $this->assertEquals('autologin@example.com', Auth::user()->email);
    }

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'loginuser@example.com',
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'loginuser@example.com',
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'display_name',
                    'email',
                ],
            ])
            ->assertJson([
                'message' => 'Logged in successfully.',
                'user' => [
                    'email' => 'loginuser@example.com',
                ],
            ]);

        $response->assertJsonMissing(['password']);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_rejects_invalid_credentials_generically(): void
    {
        User::factory()->create([
            'email' => 'realuser@example.com',
            'password' => Hash::make('ActualPassword123!'),
        ]);

        // Wrong password
        $response = $this->postJson('/api/auth/login', [
            'email' => 'realuser@example.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
        $this->assertStringContainsString('Invalid email or password', $response->json('errors.email.0'));

        // Non-existent email receives the exact same generic error
        $response2 = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'AnyPassword!',
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
        $this->assertEquals(
            $response->json('errors.email.0'),
            $response2->json('errors.email.0')
        );

        $this->assertGuest();
    }

    public function test_authenticated_user_endpoint_succeeds_when_authenticated(): void
    {
        $user = User::factory()->create([
            'display_name' => 'Active Session User',
            'email' => 'active@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/user');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'display_name' => 'Active Session User',
                    'email' => 'active@example.com',
                ],
            ]);

        $response->assertJsonMissing(['password']);
    }

    public function test_authenticated_user_endpoint_returns_401_when_anonymous(): void
    {
        $response = $this->getJson('/api/auth/user');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_logout_invalidates_session_and_authentication(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('ValidPassword123!'),
        ]);

        $headers = [
            'Origin' => 'http://127.0.0.1:5173',
            'Referer' => 'http://127.0.0.1:5173/',
        ];

        $this->withHeaders($headers)->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'ValidPassword123!',
        ])->assertStatus(200);

        $this->assertAuthenticatedAs($user);

        $response = $this->withHeaders($headers)->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully.',
            ]);

        $check = $this->withHeaders($headers)->getJson('/api/auth/user');
        $check->assertStatus(401);
    }
}
