<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AvatarController extends Controller
{
    /**
     * Upload or replace the authenticated user's avatar.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,webp',
                'max:2048', // 2MB
            ],
        ]);

        $user = $request->user();

        // Safely remove existing owned avatar if present
        if ($user->avatar_path && Storage::disk('local')->exists($user->avatar_path)) {
            Storage::disk('local')->delete($user->avatar_path);
        }

        // Generate safe random filename via store()
        $path = $request->file('avatar')->store('avatars', 'local');
        $user->avatar_path = $path;
        $user->save();

        return response()->json([
            'message' => 'Avatar uploaded successfully.',
            'user' => $user,
        ], 200);
    }

    /**
     * Remove the authenticated user's avatar.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path && Storage::disk('local')->exists($user->avatar_path)) {
            Storage::disk('local')->delete($user->avatar_path);
        }

        $user->avatar_path = null;
        $user->save();

        return response()->json([
            'message' => 'Avatar removed successfully.',
            'user' => $user,
        ], 200);
    }

    /**
     * Serve the authenticated user's avatar image without exposing storage internals.
     */
    public function show(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (! $user->avatar_path || ! Storage::disk('local')->exists($user->avatar_path)) {
            abort(404, 'Avatar not found.');
        }

        return Storage::disk('local')->response($user->avatar_path);
    }
}
