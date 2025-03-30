<?php

namespace App\Policies;

use App\Models\HmApprovalStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class HmApprovalStatusPolicy
{
    /**
     * Manage the model.
     */
    public function manage(User $user): Response
    {
        $roles = $user->roles->pluck('id')->toArray();
        return in_array(Role::SUPER_ADMIN, $roles)
            ? Response::allow()
            : Response::deny('You are not allowed to do this.');
    }
}
