<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmCategory;
use App\Models\HmLanguage;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = HmCategory::with('language')->get();
        $languages = HmLanguage::all();
        return inertia('Hymn/Admin/Category/Index')->with([
            'categories' => $categories,
            'languages' => $languages,
            'can' => [
                'add_category' => Gate::allows('manage', HmCategory::class)
            ]
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', HmCategory::class);

        $validated = $request->validate([
            'language_id' => 'integer|required',
            'name' => 'string|required'
        ]);

        $category = new HmCategory($validated);
        $category->user_id = Auth::id();
        $category->slug = SlugGenerator::generateUniqueSlug($request->name, HmCategory::class);
        $category->save();

        return redirect(route('hymn.admin.categories.index'));
    }

    public function update(Request $request, $id)
    {
        $category = HmCategory::findOrFail($id);
        Gate::authorize('manage', HmCategory::class);

        $validated = $request->validate([
            'name' => 'string|required',
        ]);
        if ($category->name !== $request->name) {
            $category->slug = SlugGenerator::generateUniqueSlug($request->name, HmCategory::class);
        }
        $category->fill($validated);
        $category->save();
        return redirect(route('hymn.admin.categories.index'));
    }

    public function destroy($id)
    {
        $category = HmCategory::findOrFail($id);
        Gate::authorize('manage', HmCategory::class);

        try {
            $category->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no subcategory within this category.');
        }
        return back();
    }
}
