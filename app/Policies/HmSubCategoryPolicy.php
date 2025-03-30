<?php

namespace App\Policies;

use App\Models\HmSubCategory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class HmSubCategoryPolicy
{
    /**
     * Manage the model.
     */
    public function manage(User $user): Response
    {
        $roles = $user->roles->pluck('id')->toArray();
        return array_intersect([Role::SUPER_ADMIN, Role::HYMN_SUB_CATEGORIES_MANAGER], $roles)
            ? Response::allow()
            : Response::deny('You are not allowed to do this.');
    }
}
