<?php

namespace App\Http\Controllers;

use App\Http\Requests\Label\StoreLabelRequest;
use App\Http\Requests\Label\UpdateLabelRequest;
use App\Http\Resources\LabelResource;
use App\Models\Label;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class LabelController extends Controller
{
    /**
     * Display a listing of the authenticated user's labels.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $labels = $request->user()
            ->labels()
            ->orderBy('name', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return LabelResource::collection($labels);
    }

    /**
     * Store a newly created label for the authenticated user.
     */
    public function store(StoreLabelRequest $request): JsonResponse
    {
        $label = $request->user()->labels()->create($request->validated());

        return (new LabelResource($label))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update the specified label.
     */
    public function update(UpdateLabelRequest $request, Label $label): LabelResource
    {
        Gate::authorize('update', $label);

        $label->update($request->validated());

        return new LabelResource($label);
    }

    /**
     * Remove the specified label.
     */
    public function destroy(Request $request, Label $label): JsonResponse
    {
        Gate::authorize('delete', $label);

        $label->delete();

        return response()->json([
            'message' => 'Label deleted successfully.',
        ], 200);
    }
}
