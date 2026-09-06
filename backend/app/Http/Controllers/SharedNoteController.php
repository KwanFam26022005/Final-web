<?php

namespace App\Http\Controllers;

use App\Http\Resources\SharedNoteResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SharedNoteController extends Controller
{
    /**
     * List all notes shared with the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $shares = $request->user()
            ->receivedShares()
            ->whereHas('note')
            ->with(['note', 'sharedBy'])
            ->orderBy('note_shares.created_at', 'desc')
            ->orderBy('note_shares.id', 'desc')
            ->get();

        return SharedNoteResource::collection($shares);
    }
}
