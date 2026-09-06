<?php

namespace App\Http\Resources;

use App\Services\NoteProtectionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SharedNoteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $note = $this->note;
        /** @var NoteProtectionService $protectionService */
        $protectionService = app(NoteProtectionService::class);
        $isProtected = $note ? $protectionService->isProtected($note) : false;
        $isUnlocked = true;

        if ($isProtected && $note) {
            $isUnlocked = $request->hasSession()
                ? $protectionService->isUnlocked($request->session(), $note)
                : false;
        }

        return [
            'share_id' => $this->id,
            'permission' => $this->permission,
            'shared_at' => $this->created_at,
            'shared_by' => [
                'id' => $this->sharedBy?->id,
                'display_name' => $this->sharedBy?->display_name,
                'email' => $this->sharedBy?->email,
            ],
            'note' => $note ? [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $isUnlocked ? $note->content : null,
                'is_protected' => $isProtected,
                'is_unlocked' => $isUnlocked,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ] : null,
        ];
    }
}
