<?php

namespace App\Http\Middleware;

use App\Models\HmHymn;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'can' => [
                    'access_main_admin' => $request->user() ? $request->user()->can('access-main-admin') : false,
                    'access_admin' => $request->user() ? $request->user()->can('access-admin') : false,
                    'manage_hymn' => $request->user() ? $request->user()->can('manage', HmHymn::class) : false,
                ],
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error')
            ],
        ];
    }
}
