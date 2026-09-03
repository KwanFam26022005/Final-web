<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Send a password reset link to the given user email address.
     * Always returns a generic response to prevent account enumeration.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        // Send reset link using Laravel password broker
        Password::sendResetLink($request->only('email'));

        // Always return generic response to prevent account enumeration
        return response()->json([
            'message' => 'If an account exists for this email, a password reset link has been sent.',
        ], 200);
    }

    /**
     * Reset the user's password using the submitted token.
     * Note: Does NOT automatically authenticate the user.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $credentials = [
            'token' => $validated['token'],
            'email' => strtolower($validated['email']),
            'password' => $validated['password'],
            'password_confirmation' => $validated['password_confirmation'],
        ];

        $status = Password::reset($credentials, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token is invalid or has expired.'],
            ]);
        }

        // Ensure user is NOT automatically authenticated (contract requirement)
        Auth::guard('web')->logout();
        Auth::forgetGuards();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Password reset successfully. Please log in with your new password.',
        ], 200);
    }
}
