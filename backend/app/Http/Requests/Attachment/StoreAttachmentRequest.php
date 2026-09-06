<?php

namespace App\Http\Requests\Attachment;

use App\Models\Attachment;
use App\Models\Note;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAttachmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Note|null $note */
        $note = $this->route('note');

        return $note !== null && (bool) $this->user()?->can('create', [Attachment::class, $note]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240', // 10 MiB limit
                'mimes:jpeg,jpg,png,webp,pdf',
                'mimetypes:image/jpeg,image/png,image/webp,application/pdf',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'An attachment file is required.',
            'file.file' => 'The uploaded item must be a valid file.',
            'file.max' => 'Attachment file size must not exceed 10 MB.',
            'file.mimes' => 'Attachment must be a file of type: jpeg, jpg, png, webp, pdf.',
            'file.mimetypes' => 'Attachment must be an image (JPEG, PNG, WebP) or PDF document.',
        ];
    }
}
