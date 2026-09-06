<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\PinNoteRequest;
use App\Http\Requests\Note\StoreNoteRequest;
use App\Http\Requests\Note\SyncNoteLabelsRequest;
use App\Http\Requests\Note\UpdateNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Services\NoteProtectionService;
use App\Services\NoteRealtimeBroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class NoteController extends Controller
{
    /**
     * Display a listing of the authenticated user's notes.
     */
    public function index(Request $request, NoteProtectionService $protectionService): AnonymousResourceCollection
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'label_ids' => ['nullable', 'array'],
            'label_ids.*' => ['integer', 'distinct', 'min:1'],
        ]);

        $user = $request->user();
        $notesQuery = $user->notes()->with('labels');

        // Optional text search with content oracle protection for locked notes
        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $escaped = addcslashes(trim($q), '%_\\');
            $pattern = '%'.$escaped.'%';

            $sessionUnlocks = (array) ($request->hasSession() ? $request->session()->get('note_unlocks', []) : []);
            $validUnlockedIds = [];
            if (! empty($sessionUnlocks)) {
                $candidateIds = array_filter(array_map('intval', array_keys($sessionUnlocks)));
                if (! empty($candidateIds)) {
                    $notesToCheck = $user->notes()->whereIn('id', $candidateIds)->get();
                    foreach ($notesToCheck as $n) {
                        if ($protectionService->isUnlocked($request->session(), $n)) {
                            $validUnlockedIds[] = $n->id;
                        }
                    }
                }
            }

            $notesQuery->where(function ($sub) use ($pattern, $validUnlockedIds) {
                $sub->where('title', 'LIKE', $pattern)
                    ->orWhere(function ($contentSub) use ($pattern, $validUnlockedIds) {
                        $contentSub->where('content', 'LIKE', $pattern)
                            ->where(function ($accessSub) use ($validUnlockedIds) {
                                $accessSub->whereNull('protection_password_hash');
                                if (! empty($validUnlockedIds)) {
                                    $accessSub->orWhereIn('id', $validUnlockedIds);
                                }
                            });
                    });
            });
        }

        // Optional multi-label filtering with ALL-match (AND) semantics
        $rawLabelIds = $request->input('label_ids');
        if (! empty($rawLabelIds)) {
            $labelIds = array_map('intval', $rawLabelIds);

            // Verify all requested label IDs belong to the authenticated user
            $ownedCount = $user->labels()->whereIn('id', $labelIds)->count();
            if ($ownedCount !== count($labelIds)) {
                throw ValidationException::withMessages([
                    'label_ids' => ['One or more selected labels are invalid.'],
                ]);
            }

            foreach ($labelIds as $labelId) {
                $notesQuery->whereHas('labels', function ($sub) use ($labelId, $user) {
                    $sub->where('labels.id', $labelId)
                        ->where('labels.user_id', $user->id);
                });
            }
        }

        $notes = $notesQuery
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return NoteResource::collection($notes);
    }

    /**
     * Store a newly created note for the authenticated user.
     */
    public function store(StoreNoteRequest $request): JsonResponse
    {
        $note = $request->user()->notes()->create($request->validated());

        return (new NoteResource($note->load('labels')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified note.
     */
    public function show(Request $request, Note $note): NoteResource
    {
        Gate::authorize('view', $note);

        return new NoteResource($note->load('labels'));
    }

    public function update(
        UpdateNoteRequest $request,
        Note $note,
        NoteProtectionService $protectionService,
        NoteRealtimeBroadcastService $broadcastService
    ): NoteResource|JsonResponse {
        Gate::authorize('editContent', $note);

        if ($protectionService->isProtected($note) && ! $protectionService->isUnlocked($request->session(), $note)) {
            return response()->json([
                'message' => 'Unlock this note before editing.',
            ], 423);
        }

        $note->update($request->validated());

        $freshNote = $note->fresh('labels');
        $broadcastService->broadcastUpdate($freshNote, $request->header('X-Socket-ID'));

        return new NoteResource($freshNote);
    }

    /**
     * Remove the specified note from storage.
     */
    public function destroy(Request $request, Note $note): Response
    {
        Gate::authorize('delete', $note);

        $note->delete();

        return response()->noContent();
    }

    /**
     * Pin or unpin the specified note.
     */
    public function pin(PinNoteRequest $request, Note $note): NoteResource
    {
        Gate::authorize('pin', $note);

        $note->update([
            'is_pinned' => $request->boolean('is_pinned'),
        ]);

        return new NoteResource($note->fresh('labels'));
    }

    /**
     * Synchronize the complete label set for the note.
     */
    public function syncLabels(SyncNoteLabelsRequest $request, Note $note): NoteResource
    {
        Gate::authorize('manageLabels', $note);

        $labelIds = $request->input('label_ids', []);
        $note->labels()->sync($labelIds);

        return new NoteResource($note->fresh('labels'));
    }
}
