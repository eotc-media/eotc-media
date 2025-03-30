<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbCategory;
use App\Models\CbLanguage;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = CbCategory::with('language')->get();
        $languages = CbLanguage::all();
        return inertia('Book/Admin/Category/Index')->with([
            'categories' => $categories,
            'languages' => $languages
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', CbCategory::class);

        $validated = $request->validate([
            'language_id' => 'integer|required',
            'name' => 'string|required'
        ]);

        $category = new CbCategory($validated);
        $category->user_id = Auth::id();
        $category->slug = SlugGenerator::generateUniqueSlug($request->name, CbCategory::class);
        $category->save();

        return redirect(route('book.admin.categories.index'));
    }

    public function destroy($id)
    {
        $category = CbCategory::findOrFail($id);
        Gate::authorize('manage', CbCategory::class);

        try {
            $category->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no subcategory within this category.');
        }
        return back();
    }
}
