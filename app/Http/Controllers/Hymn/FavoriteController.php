<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmFavorite;
use App\Models\HmLanguage;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index($language_slug, $category_slug, $sub_category_slug)
    {
        $languages = HmLanguage::with('categories.sub_categories')->get();
        $user = auth()->user();

        // Build the query for hymns
        $query = $user->favorites()->with(['channel', 'languages', 'categories', 'sub_categories', 'singers']);

        // Apply filters if necessary
        if ($language_slug != 0) {
            $query->whereHas('languages', function ($query) use ($language_slug) {
                $query->where('hm_languages.slug', $language_slug);
            });
        }

        if ($category_slug != 0) {
            $query->whereHas('categories', function ($query) use ($category_slug) {
                $query->where('hm_categories.slug', $category_slug);
            });
        }

        if ($sub_category_slug != 0) {
            $query->whereHas('sub_categories', function ($query) use ($sub_category_slug) {
                $query->where('hm_sub_categories.slug', $sub_category_slug);
            });
        }

        // Check if the hymn is in the user's favorites with a subquery
        $query->addSelect([
            'isFavorite' => HmFavorite::selectRaw('1')
                ->whereColumn('hm_favorites.hymn_id', 'hm_hymns.id')
                ->where('hm_favorites.user_id', $user->id)
                ->limit(1)
        ]);

        $hymns = $query->orderBy('clicks_count', 'DESC')->paginate(24);

        return inertia('Hymn/User/Hymn/Favorite')->with([
            'hymns' => $hymns,
            'languages' => $languages,
            'language_slug' => $language_slug,
            'category_slug' => $category_slug,
            'sub_category_slug' => $sub_category_slug,
        ]);
    }

    public function toggle($id)
    {
        $user = auth()->user();
        $user->favorites()->toggle($id);

        return redirect()->back();
    }
}
