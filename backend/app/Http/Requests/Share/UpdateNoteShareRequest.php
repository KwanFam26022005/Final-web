<?php

namespace App\Http\Requests\Share;

use App\Models\NoteShare;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteShareRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $share = $this->route('share');

        return $share instanceof NoteShare && $this->user()?->can('manageShares', $share->note);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permission' => ['required', 'string', 'in:read,edit'],
        ];
    }
}
