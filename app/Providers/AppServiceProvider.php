<?php

namespace App\Providers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::define('access-main-admin', function (User $user) {
            $roles = $user->roles->pluck('id')->toArray();
            return in_array(Role::SUPER_ADMIN, $roles)
                ? Response::allow()
                : Response::deny('You are not allowed to view this.');
        });

        Gate::define('access-admin', function (User $user) {
            $roles = $user->roles->pluck('id')->toArray();
            return array_intersect([Role::SUPER_ADMIN, Role::ADMIN], $roles)
                ? Response::allow()
                : Response::deny('You are not allowed to view this.');
        });
    }
}
