<?php

namespace Database\Factories;

use App\Models\Attachment;
use App\Models\Note;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Attachment>
 */
class AttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $uuid = Str::uuid()->toString();

        return [
            'note_id' => Note::factory(),
            'original_name' => 'document.pdf',
            'path' => "attachments/{$uuid}.pdf",
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
        ];
    }
}
