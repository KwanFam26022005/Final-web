<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\PinNoteRequest;
use App\Http\Requests\Note\StoreNoteRequest;
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
        ]);

        $notesQuery = $request->user()->notes();

        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $escaped = addcslashes(trim($q), '%_\\');
            $pattern = '%'.$escaped.'%';

            $notesQuery->where(function ($sub) use ($pattern) {
                $sub->where('title', 'LIKE', $pattern)
                    ->orWhere('content', 'LIKE', $pattern);
            });
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

        return (new NoteResource($note))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified note.
     */
    public function show(Request $request, Note $note): NoteResource
    {
        Gate::authorize('view', $note);

        return new NoteResource($note);
    }

    /**
     * Update the specified note.
     */
    public function update(UpdateNoteRequest $request, Note $note): NoteResource
    {
        Gate::authorize('update', $note);

        $note->update($request->validated());

        return new NoteResource($note->fresh());
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

        return new NoteResource($note->fresh());
    }
}
