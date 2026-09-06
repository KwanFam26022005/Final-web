<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\ProtectNoteRequest;
use App\Http\Requests\Note\RemoveProtectionRequest;
use App\Http\Requests\Note\UnlockNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Services\NoteProtectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NoteProtectionController extends Controller
{
    /**
     * Protect an unprotected note or replace the password of an unlocked protected note.
     */
    public function protect(
        ProtectNoteRequest $request,
        Note $note,
        NoteProtectionService $protectionService
    ): NoteResource|JsonResponse {
        if ($protectionService->isProtected($note) && ! $protectionService->isUnlocked($request, $note)) {
            return response()->json([
                'message' => 'Unlock this note before changing its protection password.',
            ], 423);
        }

        $protectionService->protect($note, $request->validated('password'), $request);

        return new NoteResource($note->load('labels'));
    }

    /**
     * Unlock a protected note for the current session.
     */
    public function unlock(
        UnlockNoteRequest $request,
        Note $note,
        NoteProtectionService $protectionService
    ): NoteResource {
        if (! $protectionService->isProtected($note)) {
            return new NoteResource($note->load('labels'));
        }

        if ($protectionService->isUnlocked($request, $note)) {
            return new NoteResource($note->load('labels'));
        }

        if (! $protectionService->verifyPassword($note, $request->validated('password'))) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect note password.'],
            ]);
        }

        $protectionService->grantUnlock($request, $note);

        return new NoteResource($note->load('labels'));
    }

    /**
     * Manually re-lock a note for the current session.
     */
    public function lock(
        Request $request,
        Note $note,
        NoteProtectionService $protectionService
    ): NoteResource {
        if (! $request->user() || ! $request->user()->can('view', $note)) {
            abort(403);
        }

        $protectionService->clearUnlock($request, $note);

        return new NoteResource($note->load('labels'));
    }

    /**
     * Remove password protection from a note.
     */
    public function remove(
        RemoveProtectionRequest $request,
        Note $note,
        NoteProtectionService $protectionService
    ): NoteResource {
        if (! $protectionService->isProtected($note)) {
            return new NoteResource($note->load('labels'));
        }

        if (! $protectionService->verifyPassword($note, $request->validated('password'))) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect note password.'],
            ]);
        }

        $protectionService->removeProtection($note, $request);

        return new NoteResource($note->load('labels'));
    }
}
