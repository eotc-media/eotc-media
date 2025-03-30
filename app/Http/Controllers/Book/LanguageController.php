<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbLanguage;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class LanguageController extends Controller
{
    public function index()
    {
        $languages = CbLanguage::all();
        return inertia('Book/Admin/Language/Index')->with([
            'languages' => $languages
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', CbLanguage::class);

        $validated = $request->validate([
            'name' => 'string|required'
        ]);

        $language = new CbLanguage($validated);
        $language->user_id = Auth::id();
        $language->slug = SlugGenerator::generateUniqueSlug($request->name, CbLanguage::class);
        $language->save();

        return redirect(route('book.admin.languages.index'));
    }

    public function destroy($id)
    {
        $language = CbLanguage::findOrFail($id);
        Gate::authorize('manage', CbLanguage::class);

        try {
            $language->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no category within this language.');
        }
        return back();
    }
}
