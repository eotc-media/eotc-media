<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmCategory;
use App\Models\HmSubCategory;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class SubCategoryController extends Controller
{
    public function index()
    {
        $sub_categories = HmSubCategory::with('category')->get();
        $categories = HmCategory::with('language')->get();
        return inertia('Hymn/Admin/SubCategory/Index')->with([
            'subCategories' => $sub_categories,
            'categories' => $categories,
            'can' => [
                'add_sub_category' => Gate::allows('manage', HmSubCategory::class)
            ]
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', HmSubCategory::class);

        $validated = $request->validate([
            'category_id' => 'integer|required',
            'name' => 'string|required'
        ]);

        $sub_category = new HmSubCategory($validated);
        $sub_category->user_id = Auth::id();
        $sub_category->slug = SlugGenerator::generateUniqueSlug($request->name, HmSubCategory::class);
        $sub_category->save();

        return redirect(route('hymn.admin.sub_categories.index'));
    }

    public function update(Request $request, $id)
    {
        $sub_category = HmSubCategory::findOrFail($id);
        Gate::authorize('manage', HmSubCategory::class);

        $validated = $request->validate([
            'name' => 'string|required',
        ]);
        if ($sub_category->name !== $request->name) {
            $sub_category->slug = SlugGenerator::generateUniqueSlug($request->name, HmSubCategory::class);
        }
        $sub_category->fill($validated);
        $sub_category->save();
        return redirect(route('hymn.admin.sub_categories.index'));
    }

    public function destroy($id)
    {
        $sub_category = HmSubCategory::findOrFail($id);
        Gate::authorize('manage', HmSubCategory::class);

        $sub_category->delete();
        return back();
    }
}
