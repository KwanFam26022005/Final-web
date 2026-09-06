<?php

namespace App\Http\Controllers;

use App\Http\Requests\Share\StoreNoteShareRequest;
use App\Http\Requests\Share\UpdateNoteShareRequest;
use App\Http\Resources\NoteShareResource;
use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NoteShareController extends Controller
{
    /**
     * List all shares for the specified note (owner only).
     */
    public function index(Note $note): AnonymousResourceCollection
    {
        Gate::authorize('manageShares', $note);

        $shares = $note->shares()
            ->with('sharedWith')
            ->orderBy('created_at', 'asc')
            ->get();

        return NoteShareResource::collection($shares);
    }

    /**
     * Share the note with another registered user by email (owner only).
     */
    public function store(StoreNoteShareRequest $request, Note $note): JsonResponse
    {
        Gate::authorize('manageShares', $note);

        $normalizedEmail = Str::lower(trim($request->input('email')));

        // Invariant: owner cannot share a note to their own account
        if ($normalizedEmail === Str::lower($request->user()->email)) {
            throw ValidationException::withMessages([
                'email' => ['You cannot share a note with yourself.'],
            ]);
        }

        // Lookup registered recipient
        $recipient = User::where('email', $normalizedEmail)->first();
        if (! $recipient) {
            throw ValidationException::withMessages([
                'email' => ['No account found with that email address.'],
            ]);
        }

        // Invariant: unique(note_id, shared_with_user_id)
        if ($note->shares()->where('shared_with_user_id', $recipient->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This note is already shared with this user.'],
            ]);
        }

        $share = $note->shares()->create([
            'shared_by_user_id' => $request->user()->id,
            'shared_with_user_id' => $recipient->id,
            'permission' => $request->input('permission'),
        ]);

        return (new NoteShareResource($share->load('sharedWith')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update the permission of an existing note share (owner only).
     */
    public function update(UpdateNoteShareRequest $request, NoteShare $share): NoteShareResource
    {
        Gate::authorize('manageShares', $share->note);

        $share->update([
            'permission' => $request->input('permission'),
        ]);

        return new NoteShareResource($share->load('sharedWith'));
    }

    /**
     * Revoke an existing note share (owner only).
     */
    public function destroy(NoteShare $share): Response
    {
        Gate::authorize('manageShares', $share->note);

        $share->delete();

        return response()->noContent();
    }
}
