<?php

namespace App\Policies;

use App\Models\Label;
use App\Models\User;

class LabelPolicy
{
    /**
     * Determine whether the user can view the label.
     */
    public function view(User $user, Label $label): bool
    {
        return $user->id === $label->user_id;
    }

    /**
     * Determine whether the user can update the label.
     */
    public function update(User $user, Label $label): bool
    {
        return $user->id === $label->user_id;
    }

    /**
     * Determine whether the user can delete the label.
     */
    public function delete(User $user, Label $label): bool
    {
        return $user->id === $label->user_id;
    }
}
