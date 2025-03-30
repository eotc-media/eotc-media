<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmHymn;
use App\Models\HmSinger;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class SingerController extends Controller
{
    public function store(Request $request)
    {
        Gate::authorize('manage', HmHymn::class);

        $validated = $request->validate([
            'name' => 'string|required'
        ]);

        $singer = new HmSinger($validated);
        $singer->user_id = Auth::id();
        $singer->slug = SlugGenerator::generateUniqueSlug($request->name, HmSinger::class);
        $singer->save();

        return redirect(route('hymn.admin.hymns.new'));
    }
}
