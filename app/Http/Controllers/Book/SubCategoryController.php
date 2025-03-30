<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbCategory;
use App\Models\CbSubCategory;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class SubCategoryController extends Controller
{
    public function index()
    {
        $sub_categories = CbSubCategory::with('category')->get();
        $categories = CbCategory::with('language')->get();
        return inertia('Book/Admin/SubCategory/Index')->with([
            'subCategories' => $sub_categories,
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', CbSubCategory::class);

        $validated = $request->validate([
            'category_id' => 'integer|required',
            'name' => 'string|required'
        ]);

        $sub_category = new CbSubCategory($validated);
        $sub_category->user_id = Auth::id();
        $sub_category->slug = SlugGenerator::generateUniqueSlug($request->name, CbSubCategory::class);
        $sub_category->save();

        return redirect(route('book.admin.sub_categories.index'));
    }

    public function destroy($id)
    {
        $sub_category = CbSubCategory::findOrFail($id);
        Gate::authorize('manage', CbSubCategory::class);

        $sub_category->delete();
        return back();
    }
}
