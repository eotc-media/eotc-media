<?php

namespace App\Http\Controllers\Main;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Utils\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function show_profile()
    {
        return inertia('Main/User/Profile/Show');
    }

    public function edit_profile()
    {
        $user = Auth::user();
        return inertia('Main/User/Profile/Edit')->with('user', $user);
    }

    public function update_profile(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'image' => 'nullable|image|max:10240',
        ]);
        $user = User::findOrFail(Auth::id());
        if ($request->hasFile('image')) {
            $image_name_to_save = ImageUploader::upload_user_image($request->file('image'));
            Storage::delete('public/user/image/' . $user->image);
            $user->image = $image_name_to_save;
        }
        $user->name = $request->input('name');
        $user->update();
        return redirect(route('user.profile.show'));
    }
}
