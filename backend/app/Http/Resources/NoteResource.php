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

        $user = $request->user();
        $isOwner = $user && $user->id === $this->user_id;

        $accessType = $isOwner ? 'owner' : 'shared';
        if ($isOwner) {
            $permission = 'owner';
        } else {
            $share = $user ? $this->shares()->where('shared_with_user_id', $user->id)->first() : null;
            $permission = $share ? $share->permission : null;
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $isUnlocked ? $this->content : null,
            'is_pinned' => (bool) $this->is_pinned,
            'is_protected' => $isProtected,
            'is_unlocked' => $isUnlocked,
            'access_type' => $accessType,
            'permission' => $permission,
            'labels' => $isOwner
                ? LabelResource::collection($this->whenLoaded('labels'))
                : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
