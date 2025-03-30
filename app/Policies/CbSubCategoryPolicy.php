<?php

namespace App\Policies;

use App\Models\CbSubCategory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CbSubCategoryPolicy
{
    /**
     * Manage the model.
     */
    public function manage(User $user): Response
    {
        $roles = $user->roles->pluck('id')->toArray();
        return array_intersect([Role::SUPER_ADMIN, Role::BOOK_SUB_CATEGORIES_MANAGER], $roles)
            ? Response::allow()
            : Response::deny('You are not allowed to do this.');
    }
}
