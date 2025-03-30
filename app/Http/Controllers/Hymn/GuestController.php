<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmApprovalStatus;
use App\Models\HmChannel;
use App\Models\HmFavorite;
use App\Models\HmHymn;
use App\Models\HmLanguage;
use App\Models\HmSinger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuestController extends Controller
{
    public function index()
    {
        return redirect(route('hymn.hymns.index', [0, 0, 0]));
    }

    public function hymns($language_slug, $category_slug, $sub_category_slug)
    {
        $languages = HmLanguage::with('categories.sub_categories')->get();
        $user = Auth::user();

        // Fetch singers with hymns in the selected language
        if ($language_slug != 0) {
            $singers = HmSinger::select('id', 'name', 'slug')
                ->whereHas('hymns.languages', function ($query) use ($language_slug) {
                    $query->where('slug', $language_slug);
                })->orderBy('name')->get();
        } else {
            $singers = HmSinger::select('id', 'name', 'slug')->orderBy('name')->get();
        }

        // Build the query for hymns
        $query = HmHymn::where('approval_status_id', HmApprovalStatus::ACCEPTED)
            ->with(['channel', 'languages', 'categories', 'sub_categories', 'singers']);

        // Adjust the filter logic
        if ($language_slug != 0) {
            $query->whereHas('languages', function ($query) use ($language_slug) {
                $query->where('hm_languages.slug', $language_slug);
            });
        }

        if ($category_slug != 0) {
            if ($category_slug == 'by-singer') {
                if ($sub_category_slug != 0) {
                    // Filter by singer
                    $query->whereHas('singers', function ($query) use ($sub_category_slug) {
                        $query->where('slug', $sub_category_slug);
                    });
                }
                // No additional filters needed when sub_category_slug is 0
            } else {
                // Filter by category
                $query->whereHas('categories', function ($query) use ($category_slug) {
                    $query->where('hm_categories.slug', $category_slug);
                });

                if ($sub_category_slug != 0) {
                    $query->whereHas('sub_categories', function ($query) use ($sub_category_slug) {
                        $query->where('hm_sub_categories.slug', $sub_category_slug);
                    });
                }
            }
        }

        if ($user) {
            $query->addSelect([
                'isFavorite' => HmFavorite::selectRaw('1')
                    ->whereColumn('hm_favorites.hymn_id', 'hm_hymns.id')
                    ->where('hm_favorites.user_id', $user->id)
                    ->limit(1)
            ]);
        }

        $hymns = $query->orderBy('clicks_count', 'DESC')->paginate(24);

        if (!$user) {
            foreach ($hymns as $hymn) {
                $hymn->isFavorite = 0;
            }
        }

        // Get the total number of hymns
        $hymns_count = $hymns->total();


        return inertia('Hymn/Guest/Hymn/Index')->with([
            'hymns' => $hymns,
            'languages' => $languages,
            'language_slug' => $language_slug,
            'category_slug' => $category_slug,
            'sub_category_slug' => $sub_category_slug,
            'singers' => $singers,
            'hymns_count' => $hymns_count,
        ]);
    }

    public function singer_hymns($singer_slug)
    {
        $singer = HmSinger::where('slug', $singer_slug)->first();
        $languages = HmLanguage::with('categories.sub_categories')->get();
        $user = Auth::user();

        $hymns = HmSinger::where('slug', $singer_slug)
            ->first()
            ->hymns()
            ->where('approval_status_id', HmApprovalStatus::ACCEPTED)
            ->with(['channel', 'languages', 'categories', 'sub_categories'])
            ->get()
            ->map(function ($hymn) use ($user) {
                $hymn->isFavorite = $user ? HmFavorite::where('hymn_id', $hymn->id)
                    ->where('user_id', $user->id)
                    ->exists() : 0;
                return $hymn;
            });

        return inertia('Hymn/Guest/Hymn/HymnsBySinger')->with([
            'singer' => $singer,
            'hymns' => $hymns,
            'languages' => $languages,
        ]);
    }

    public function watch($hymn_slug)
    {
        $user = Auth::user();
        $hymn = HmHymn::with([
            'channel.accepted_hymns',
            'favors' => function ($query) use ($user) {
                if ($user) {
                    $query->where('user_id', $user->id);
                }
            }
        ])
            ->where('slug', $hymn_slug)
            ->first();

        $hymn->isFavorite = $user ? $hymn->favors->isNotEmpty() : 0;
        $clickedHymns = session()->get('clicked_hymns', []);
        if (!in_array($hymn->id, $clickedHymns)) {
            $hymn->increment('clicks_count');
            session()->push('clicked_hymns', $hymn->id);
        }
        return inertia('Hymn/Guest/Hymn/Watch')->with([
            'hymn' => $hymn
        ]);
    }

    public function channels()
    {
        $channels = HmChannel::where('approval_status_id', 2)->withCount('accepted_hymns')->get();
        return inertia('Hymn/Guest/Channel/Index')->with([
            'channels' => $channels
        ]);
    }

    public function show_channel($channel_slug)
    {
        $channel = HmChannel::where('slug', $channel_slug)->withCount('accepted_hymns')->first();
        $user = Auth::user();
        $hymns = HmHymn::where('channel_id', $channel->id)
            ->where('approval_status_id', HmApprovalStatus::ACCEPTED)
            ->with('channel')
            ->when($user, function ($query) use ($user) {
                $query->addSelect([
                    'isFavorite' => HmFavorite::selectRaw('1')
                        ->whereColumn('hm_favorites.hymn_id', 'hm_hymns.id')
                        ->where('hm_favorites.user_id', $user->id)
                        ->limit(1)
                ]);
            })
            ->orderBy('published_at', 'DESC')
            ->paginate(24);

        if (!$user) {
            foreach ($hymns as $hymn) {
                $hymn->isFavorite = 0;
            }
        }
        return inertia('Hymn/Guest/Channel/Show')->with([
            'channel' => $channel,
            'hymns' => $hymns,
        ]);
    }

    public function update_lyrics(Request $request, string $id)
    {
        $validated = $request->validate([
            'lyrics_suggestion' => 'nullable',
        ]);
        HmHymn::findOrFail($id)->update($validated);
        return redirect()->back()->with('success', 'የግጥም ማስተካከያውን በተሳካ ሁኔታ ልከዋል፤ ካየነው በኋላ ማስተካከያ እናደርጋለን። እናመሰግናለን።');
    }
}
