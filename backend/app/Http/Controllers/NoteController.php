<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\PinNoteRequest;
use App\Http\Requests\Note\StoreNoteRequest;
use App\Http\Requests\Note\SyncNoteLabelsRequest;
use App\Http\Requests\Note\UpdateNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class NoteController extends Controller
{
    /**
     * Display a listing of the authenticated user's notes.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'label_ids' => ['nullable'],
        ]);

        $user = $request->user();
        $notesQuery = $user->notes()->with('labels');

        // Optional text search
        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $escaped = addcslashes(trim($q), '%_\\');
            $pattern = '%'.$escaped.'%';

            $notesQuery->where(function ($sub) use ($pattern) {
                $sub->where('title', 'LIKE', $pattern)
                    ->orWhere('content', 'LIKE', $pattern);
            });
        }

        // Optional multi-label filtering with ALL-match (AND) semantics
        $rawLabelIds = $request->input('label_ids');
        if ($rawLabelIds !== null) {
            if (is_string($rawLabelIds)) {
                $rawLabelIds = explode(',', $rawLabelIds);
            }
            $labelIds = array_filter(
                array_map('intval', (array) $rawLabelIds),
                fn ($id) => $id > 0
            );
            $labelIds = array_values(array_unique($labelIds));

            if (! empty($labelIds)) {
                // Verify all requested label IDs belong to the authenticated user
                $ownedCount = $user->labels()->whereIn('id', $labelIds)->count();
                if ($ownedCount !== count($labelIds)) {
                    // Foreign label ID must not reveal existence or leak notes
                    $notesQuery->whereRaw('1 = 0');
                } else {
                    foreach ($labelIds as $labelId) {
                        $notesQuery->whereHas('labels', function ($sub) use ($labelId, $user) {
                            $sub->where('labels.id', $labelId)
                                ->where('labels.user_id', $user->id);
                        });
                    }
                }
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

    /**
     * Update the specified note.
     */
    public function update(UpdateNoteRequest $request, Note $note): NoteResource
    {
        Gate::authorize('update', $note);

        $note->update($request->validated());

        return new NoteResource($note->fresh('labels'));
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
        Gate::authorize('update', $note);

        $labelIds = $request->input('label_ids', []);
        $note->labels()->sync($labelIds);

        return new NoteResource($note->fresh('labels'));
    }
}
