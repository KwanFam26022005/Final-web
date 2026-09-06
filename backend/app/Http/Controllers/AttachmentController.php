<?php

namespace App\Http\Controllers;

use App\Http\Requests\Attachment\StoreAttachmentRequest;
use App\Http\Resources\AttachmentResource;
use App\Models\Attachment;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    /**
     * Map of allowed MIME types to canonical safe extensions.
     *
     * @var array<string, string>
     */
    private const ALLOWED_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];

    /**
     * List all attachments belonging to the note.
     */
    public function index(Note $note): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', [Attachment::class, $note]);

        $attachments = $note->attachments()
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return AttachmentResource::collection($attachments);
    }

    /**
     * Store a newly uploaded attachment for the note.
     */
    public function store(StoreAttachmentRequest $request, Note $note): JsonResponse
    {
        Gate::authorize('create', [Attachment::class, $note]);

        $file = $request->file('file');
        $detectedMime = $file->getMimeType();

        if (! isset(self::ALLOWED_MIMES[$detectedMime])) {
            throw ValidationException::withMessages([
                'file' => ['Attachment must be an image (JPEG, PNG, WebP) or PDF document.'],
            ]);
        }

        $safeExtension = self::ALLOWED_MIMES[$detectedMime];
        $storedFilename = Str::uuid()->toString().'.'.$safeExtension;
        $storageDir = "attachments/{$note->id}";
        $path = "{$storageDir}/{$storedFilename}";

        // Persist to private local disk
        $stored = Storage::disk('local')->putFileAs($storageDir, $file, $storedFilename);
        if (! $stored) {
            throw new \RuntimeException('Failed to store attachment file.');
        }

        // Sanitize original filename for display metadata only
        $originalName = basename(strip_tags($file->getClientOriginalName()));
        if (trim($originalName) === '') {
            $originalName = "attachment.{$safeExtension}";
        }

        try {
            $attachment = $note->attachments()->create([
                'original_name' => $originalName,
                'path' => $path,
                'mime_type' => $detectedMime,
                'size_bytes' => $file->getSize(),
            ]);
        } catch (\Throwable $e) {
            // Clean up stored file if metadata creation fails to prevent orphaned files
            Storage::disk('local')->delete($path);
            throw $e;
        }

        return (new AttachmentResource($attachment))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Stream the attachment content inline with appropriate headers.
     */
    public function content(Attachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $attachment);

        if (! Storage::disk('local')->exists($attachment->path)) {
            abort(404, 'Attachment file not found.');
        }

        $safeName = addcslashes(basename($attachment->original_name), '"\\');

        return Storage::disk('local')->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type,
                'Content-Disposition' => 'inline; filename="'.$safeName.'"',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    /**
     * Download the attachment file.
     */
    public function download(Attachment $attachment): StreamedResponse
    {
        Gate::authorize('download', $attachment);

        if (! Storage::disk('local')->exists($attachment->path)) {
            abort(404, 'Attachment file not found.');
        }

        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    /**
     * Delete the specified attachment.
     */
    public function destroy(Attachment $attachment): Response
    {
        Gate::authorize('delete', $attachment);

        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        return response()->noContent();
    }
}
