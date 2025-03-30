<?php

namespace App\Http\Controllers\Main;

use App\Http\Controllers\Controller;
use App\Models\ContactUs;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminController extends Controller
{
    public function dashboard()
    {
        return inertia('Main/Admin/Dashboard');
    }

    public function users_index()
    {
        $users = User::with('roles')->paginate(20);
        return inertia('Main/Admin/User/Index')->with('users', $users);
    }

    public function users_show($id)
    {
        $user = User::findOrFail($id);
        $user_role_names = $user->roles->pluck('name');
        $roles = Role::all();
        $user_role_ids = $user->roles->pluck('id');
        return inertia('Main/Admin/User/Show')->with([
            'user' => $user,
            'roles' => $roles,
            'user_role_names' => $user_role_names,
            'user_role_ids' => $user_role_ids,
        ]);
    }

    public function users_change_role(Request $request, $id)
    {
        $request->validate([
            'role_id.*' => 'required|integer',
        ]);
        $user = User::findOrFail($id);
        $user->roles()->detach();
        $user->roles()->attach($request->role_id);
        return redirect(route('admin.users.show', $id));
    }

    public function feedbacks_index()
    {
        $feedbacks = ContactUs::paginate(20);
        return inertia('Main/Admin/Feedback/Index')->with('feedbacks', $feedbacks);
    }
}
