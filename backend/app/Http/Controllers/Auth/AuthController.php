<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and automatically authenticate them.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'display_name' => $request->validated('display_name'),
            'email' => strtolower($request->validated('email')),
            'password' => Hash::make($request->validated('password')),
        ]);

        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
        ], 201);
    }

    /**
     * Authenticate an existing user and regenerate the session.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => strtolower($request->validated('email')),
            'password' => $request->validated('password'),
        ];

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => Auth::user(),
        ]);
    }

    /**
     * Log out the authenticated user and invalidate the session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        Auth::forgetGuards();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
