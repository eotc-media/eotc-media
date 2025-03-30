<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmApprovalStatus;
use App\Models\HmHymn;
use App\Models\HmLanguage;
use App\Models\HmSinger;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminController extends Controller
{
    public function dashboard()
    {
        // Fetch total users
        $total_users = User::all();

        // Precompute chart data for uploaded, accepted, and declined hymns
        $hymns = HmHymn::orderBy('created_at')->get(['created_at', 'approval_status_id', 'clicks_count']);

        // Group by date and calculate cumulative counts
        $uploaded_hymns_data = $this->getCumulativeChartData($hymns);
        $accepted_hymns_data = $this->getCumulativeChartData($hymns->where('approval_status_id', 2));
        $declined_hymns_data = $this->getCumulativeChartData($hymns->where('approval_status_id', 3));

        // Total counts for display
        $total_uploaded_hymns = $hymns->count();
        $total_accepted_hymns = $hymns->where('approval_status_id', 2)->count();
        $total_clicks = $hymns->sum('clicks_count');
        $total_declined_hymns = $hymns->where('approval_status_id', 3)->count();

        return inertia('Hymn/Admin/Dashboard', [
            'total_users' => $total_users,
            'total_uploaded_hymns_count' => $total_uploaded_hymns,
            'total_accepted_hymns_count' => $total_accepted_hymns,
            'total_clicks' => $total_clicks,
            'total_declined_hymns_count' => $total_declined_hymns,
            'uploaded_hymns_data' => $uploaded_hymns_data,
            'accepted_hymns_data' => $accepted_hymns_data,
            'declined_hymns_data' => $declined_hymns_data,
        ]);
    }

    private function getCumulativeChartData($hymns)
    {
        $data = [];
        $cumulativeCount = 0;

        // Group by date to reduce points (optional aggregation)
        $hymnsByDate = $hymns->groupBy(function ($hymn) {
            return $hymn->created_at->toDateString(); // Aggregate by day
        });

        foreach ($hymnsByDate as $date => $group) {
            $cumulativeCount += $group->count();
            $data[] = [
                'x' => $date,
                'y' => $cumulativeCount,
            ];
        }

        return $data;
    }

    public function new_hymns()
    {
        $hymns = HmHymn::where('approval_status_id', 1)->with(['languages', 'categories', 'sub_categories', 'approval_status'])->get();
        $singers = HmSinger::orderBy('name')->get();
        return inertia('Hymn/Admin/Hymn/New')->with([
            'hymns' => $hymns,
            'singers' => $singers,
            'can' => [
                'manage_hymn' => Gate::allows('manage', HmHymn::class)
            ]
        ]);
    }

    public function lyrics_suggestion()
    {
        $hymns = HmHymn::whereNotNull('lyrics_suggestion')->paginate(20);
        return inertia('Hymn/Admin/Hymn/LyricsSuggestion')->with([
            'hymns' => $hymns,
            'can' => [
                'manage_hymn' => Gate::allows('manage', HmHymn::class)
            ]
        ]);
    }

    public function approve_lyrics(string $id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::findOrFail($id);
        $hymn->lyrics = $hymn->lyrics_suggestion;
        $hymn->lyrics_suggestion = null;
        $hymn->update();
        return redirect(route('hymn.admin.hymns.lyrics_suggestion'));
    }

    public function decline_lyrics(string $id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::findOrFail($id);
        $hymn->lyrics_suggestion = null;
        $hymn->update();
        return redirect(route('hymn.admin.hymns.lyrics_suggestion'));
    }

    public function hymns_index()
    {
        $hymns = HmHymn::with(['languages', 'categories', 'sub_categories', 'approval_status'])->paginate(20);
        return inertia('Hymn/Admin/Hymn/Index')->with([
            'hymns' => $hymns,
            'can' => [
                'manage_hymn' => Gate::allows('manage', HmHymn::class)
            ]
        ]);
    }

    public function edit_hymn($id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::with(['languages', 'categories', 'sub_categories', 'singers'])->findOrFail($id);
        $languages = HmLanguage::with('categories.sub_categories')->get();
        $singers = HmSinger::all();
        return inertia('Hymn/Admin/Hymn/Edit')->with([
            'hymn' => $hymn,
            'languages' => $languages,
            'singers' => $singers
        ]);
    }

    public function update_hymn(Request $request, $id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::findOrFail($id);

        $validated = $request->validate([
            'singer' => 'string|nullable',
            'description' => 'nullable',
        ]);
        $request->validate([
            'language_id' => 'required|array',
            'language_id.*' => 'integer|required',
            'category_id' => 'required|array',
            'category_id.*' => 'integer|required',
            'sub_category_id' => 'required|array',
            'sub_category_id.*' => 'integer|required',
            'singer_id' => 'required|array',
            'singer_id.*' => 'integer|required'
        ]);
        $hymn->fill($validated);
        $hymn->approval_status_id = HmApprovalStatus::ACCEPTED;
        $hymn->update();

        $hymn->languages()->detach();
        $hymn->categories()->detach();
        $hymn->sub_categories()->detach();
        $hymn->singers()->detach();
        $hymn->languages()->attach($request->language_id);
        $hymn->categories()->attach($request->category_id);
        $hymn->sub_categories()->attach($request->sub_category_id);
        $hymn->singers()->attach($request->singer_id);

        return redirect(route('hymn.admin.hymns.index'));
    }

    public function accept_hymn(Request $request, $id)
    {
        Gate::authorize('manage', HmHymn::class);

        $request->validate([
            'singer_id' => 'required|array',
            'singer_id.*' => 'integer|required'
        ]);
        $hymn = HmHymn::findOrFail($id);
        $hymn->approval_status_id = HmApprovalStatus::ACCEPTED;
        $hymn->update();
        $hymn->singers()->attach($request->singer_id);
        $channel = $hymn->channel;
        if ($channel->approval_status_id !== HmApprovalStatus::ACCEPTED) {
            $channel->approval_status_id = HmApprovalStatus::ACCEPTED;
            $channel->update();
        }
        return redirect(route('hymn.admin.hymns.new'));
    }

    public function decline_hymn($id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::findOrFail($id);
        $hymn->approval_status_id = HmApprovalStatus::DECLINED;
        $hymn->update();

        return redirect(route('hymn.admin.hymns.new'));
    }

    public function delete_hymn($id)
    {
        Gate::authorize('manage', HmHymn::class);

        $hymn = HmHymn::findOrFail($id);
        $hymn->delete();

        return back();
    }
}
