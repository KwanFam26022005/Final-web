<?php

namespace App\Http\Requests\Label;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->name)) {
            $this->merge([
                'name' => trim($this->name),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $label = $this->route('label');
        $labelId = is_object($label) ? $label->id : $label;

        return [
            'name' => [
                'required',
                'string',
                'min:1',
                'max:50',
                Rule::unique('labels', 'name')
                    ->where(fn ($query) => $query->where('user_id', $this->user()->id))
                    ->ignore($labelId),
            ],
        ];
    }
}
