<?php

namespace App\Http\Requests\Note;

use Illuminate\Foundation\Http\FormRequest;

class SyncNoteLabelsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $note = $this->route('note');

        return $note && $this->user() && $this->user()->can('update', $note);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label_ids' => ['present', 'array'],
            'label_ids.*' => ['integer', 'distinct'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $labelIds = $this->input('label_ids');
            if (! is_array($labelIds) || empty($labelIds)) {
                return;
            }

            $uniqueIds = array_values(array_unique($labelIds));
            $user = $this->user();
            $ownedCount = $user ? $user->labels()->whereIn('id', $uniqueIds)->count() : 0;

            if ($ownedCount !== count($uniqueIds)) {
                $validator->errors()->add('label_ids', 'One or more selected labels are invalid.');
            }
        });
    }
}
