<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PreferenceController extends Controller
{
    /**
     * Get the authenticated user's preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $preference = $request->user()->getOrCreatePreference();

        return response()->json([
            'preference' => $preference,
        ], 200);
    }

    /**
     * Update the authenticated user's preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme' => ['sometimes', 'string', Rule::in(['system', 'light', 'dark'])],
            'default_note_view' => ['sometimes', 'string', Rule::in(['grid', 'list'])],
        ]);

        $preference = $request->user()->getOrCreatePreference();
        $preference->update($validated);

        return response()->json([
            'message' => 'Preferences updated successfully.',
            'preference' => $preference,
        ], 200);
    }
}
