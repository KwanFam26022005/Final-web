<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\DatabaseTestCase;

class ProfileAndAvatarTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_profile_read_returns_authenticated_user_data(): void
    {
        $user = User::factory()->create([
            'display_name' => 'Profile User',
            'email' => 'profile@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/account/profile');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'display_name' => 'Profile User',
                    'email' => 'profile@example.com',
                ],
            ]);

        $response->assertJsonMissing(['password']);
        $response->assertJsonMissing(['avatar_path']);
    }

    public function test_display_name_and_email_update_succeeds(): void
    {
        $user = User::factory()->create([
            'display_name' => 'Original Name',
            'email' => 'original@example.com',
        ]);

        $response = $this->actingAs($user)->patchJson('/api/account/profile', [
            'display_name' => 'Updated Name',
            'email' => 'original@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'user' => [
                    'display_name' => 'Updated Name',
                    'email' => 'original@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'display_name' => 'Updated Name',
        ]);
    }

    public function test_email_uniqueness_validation_rejects_duplicate(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create(['email' => 'current@example.com']);

        $response = $this->actingAs($user)->patchJson('/api/account/profile', [
            'display_name' => 'Test Name',
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_email_change_resets_verification_and_dispatches_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'verified@example.com',
            'email_verified_at' => now(),
        ]);

        $this->assertTrue($user->hasVerifiedEmail());

        $response = $this->actingAs($user)->patchJson('/api/account/profile', [
            'display_name' => $user->display_name,
            'email' => 'newaddress@example.com',
        ]);

        $response->assertStatus(200);

        $freshUser = $user->fresh();
        $this->assertEquals('newaddress@example.com', $freshUser->email);
        $this->assertNull($freshUser->email_verified_at);
        $this->assertFalse($freshUser->hasVerifiedEmail());

        Notification::assertSentTo($freshUser, VerifyEmail::class);
    }

    public function test_cross_user_profile_mutation_is_impossible(): void
    {
        $userA = User::factory()->create(['email' => 'usera@example.com']);
        $userB = User::factory()->create(['email' => 'userb@example.com']);

        // User A updates profile with a payload attempting to pass user_id of User B
        $response = $this->actingAs($userA)->patchJson('/api/account/profile', [
            'user_id' => $userB->id,
            'id' => $userB->id,
            'display_name' => 'Malicious Update',
            'email' => 'usera@example.com',
        ]);

        $response->assertStatus(200);

        // User B must remain unchanged
        $this->assertNotEquals('Malicious Update', $userB->fresh()->display_name);

        // Only User A was updated
        $this->assertEquals('Malicious Update', $userA->fresh()->display_name);
    }

    public function test_valid_avatar_upload_stores_file_and_updates_user(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->actingAs($user)->postJson('/api/account/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Avatar uploaded successfully.',
            ]);

        $freshUser = $user->fresh();
        $this->assertNotNull($freshUser->avatar_path);
        Storage::disk('local')->assertExists($freshUser->avatar_path);

        // Filesystem internal path must NOT be in API response
        $response->assertJsonMissing(['avatar_path']);
        $this->assertEquals('/api/account/avatar', $response->json('user.avatar_url'));
    }

    public function test_invalid_avatar_mime_type_rejected(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('malicious.svg', 100, 'image/svg+xml');

        $response = $this->actingAs($user)->postJson('/api/account/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    public function test_avatar_exceeding_2mb_rejected(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        // 2.5 MB file (2500 KB > 2048 KB limit)
        $file = UploadedFile::fake()->image('large.png')->size(2500);

        $response = $this->actingAs($user)->postJson('/api/account/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    public function test_avatar_replacement_deletes_superseded_file(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        // Upload first avatar
        $firstFile = UploadedFile::fake()->image('first.png', 100, 100);
        $this->actingAs($user)->postJson('/api/account/avatar', ['avatar' => $firstFile])->assertStatus(200);
        $firstPath = $user->fresh()->avatar_path;
        Storage::disk('local')->assertExists($firstPath);

        // Upload second avatar
        $secondFile = UploadedFile::fake()->image('second.png', 100, 100);
        $this->actingAs($user)->postJson('/api/account/avatar', ['avatar' => $secondFile])->assertStatus(200);
        $secondPath = $user->fresh()->avatar_path;

        // Old file must be deleted, new file must exist
        Storage::disk('local')->assertMissing($firstPath);
        Storage::disk('local')->assertExists($secondPath);
        $this->assertNotEquals($firstPath, $secondPath);
    }

    public function test_avatar_removal_deletes_file_and_clears_path(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('photo.jpg', 100, 100);
        $this->actingAs($user)->postJson('/api/account/avatar', ['avatar' => $file])->assertStatus(200);
        $path = $user->fresh()->avatar_path;
        Storage::disk('local')->assertExists($path);

        $response = $this->actingAs($user)->deleteJson('/api/account/avatar');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Avatar removed successfully.',
            ]);

        $this->assertNull($user->fresh()->avatar_path);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_avatar_endpoint_serves_image_to_authenticated_user(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg', 50, 50);
        $this->actingAs($user)->postJson('/api/account/avatar', ['avatar' => $file])->assertStatus(200);

        // Authenticated owner can retrieve avatar
        $response = $this->actingAs($user)->get('/api/account/avatar');
        $response->assertStatus(200);
    }

    public function test_avatar_endpoint_returns_401_when_anonymous(): void
    {
        $response = $this->getJson('/api/account/avatar');
        $response->assertStatus(401);
    }
}
