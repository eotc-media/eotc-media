<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Auth;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): Response
    {
        $user_roles = $user->roles->pluck('id')->toArray();
        return array_intersect($user_roles, [Role::SUPER_ADMIN, Role::ADMIN])
            ? Response::allow()
            : Response::deny('You do not have permission to view this.');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): Response
    {
        $user_roles = $user->roles->pluck('id')->toArray();
        return array_intersect($user_roles, [Role::SUPER_ADMIN, Role::ADMIN])
            ? Response::allow()
            : Response::deny('You do not have permission to view this.');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): Response
    {
        $user_roles = $user->roles->pluck('id')->toArray();
        return array_intersect($user_roles, [Role::SUPER_ADMIN, Role::ADMIN])
            ? Response::allow()
            : Response::deny('You do not have permission to view this.');
    }
}
