<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmLanguage;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class LanguageController extends Controller
{
    public function index()
    {
        $languages = HmLanguage::all();
        return inertia('Hymn/Admin/Language/Index')->with([
            'languages' => $languages,
            'can' => [
                'add_language' => Gate::allows('manage', HmLanguage::class)
            ]
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', HmLanguage::class);

        $validated = $request->validate([
            'name' => 'string|required'
        ]);

        $language = new HmLanguage($validated);
        $language->user_id = Auth::id();
        $language->slug = SlugGenerator::generateUniqueSlug($request->name, HmLanguage::class);
        $language->save();

        return redirect(route('hymn.admin.languages.index'));
    }

    public function update(Request $request, $id)
    {
        $language = HmLanguage::findOrFail($id);
        Gate::authorize('manage', HmLanguage::class);

        $validated = $request->validate([
            'name' => 'string|required',
        ]);
        if ($language->name !== $request->name) {
            $language->slug = SlugGenerator::generateUniqueSlug($request->name, HmLanguage::class);
        }
        $language->fill($validated);
        $language->save();
        return redirect(route('hymn.admin.languages.index'));
    }

    public function destroy($id)
    {
        $language = HmLanguage::findOrFail($id);
        Gate::authorize('manage', HmLanguage::class);

        try {
            $language->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no category within this language.');
        }
        return back();
    }
}
