<?php

namespace App\Http\Resources;

use App\Services\NoteProtectionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var NoteProtectionService $protectionService */
        $protectionService = app(NoteProtectionService::class);
        $isProtected = $protectionService->isProtected($this->resource);
        $isUnlocked = true;

        if ($isProtected) {
            $isUnlocked = $request->hasSession()
                ? $protectionService->isUnlocked($request->session(), $this->resource)
                : false;
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $isUnlocked ? $this->content : null,
            'is_pinned' => (bool) $this->is_pinned,
            'is_protected' => $isProtected,
            'is_unlocked' => $isUnlocked,
            'labels' => LabelResource::collection($this->whenLoaded('labels')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
