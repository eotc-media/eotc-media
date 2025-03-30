<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmApprovalStatus;
use App\Models\HmChannel;
use App\Models\HmHymn;
use App\Models\HmLanguage;
use App\Utils\SlugGenerator;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HymnController extends Controller
{
    public function index()
    {
        $hymns = HmHymn::where('user_id', Auth::id())->with(['languages', 'categories', 'sub_categories', 'approval_status'])->paginate(20);
        return inertia('Hymn/User/Hymn/Index')->with('hymns', $hymns);
    }

    public function create()
    {
        $languages = HmLanguage::with('categories.sub_categories')->get();
        return inertia('Hymn/User/Hymn/Create')->with([
            'languages' => $languages,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'video_id' => 'string|required|unique:hm_hymns,video_id',
            'singer' => 'string|nullable',
            'lyrics' => 'nullable',
            'description' => 'nullable'
        ]);

        $request->validate([
            'language_id' => 'required|array',
            'language_id.*' => 'integer|required',
            'category_id' => 'required|array',
            'category_id.*' => 'integer|required',
            'sub_category_id' => 'required|array',
            'sub_category_id.*' => 'integer|required',
        ]);

        $api_key = env('YOUTUBE_API_KEY');

        $video_id = $request->video_id;

        // Make the API call to YouTube
        $client = new Client();
        $response = $client->get('https://www.googleapis.com/youtube/v3/videos', [
            'query' => [
                'id' => $video_id,
                'key' => $api_key,
                'part' => 'snippet'
            ]
        ]);

        $data = json_decode($response->getBody(), true);
        $video_details = $data['items'][0]['snippet'];
        $channel_id = $video_details['channelId'];

        $response = $client->get('https://www.googleapis.com/youtube/v3/channels', [
            'query' => [
                'id' => $channel_id,
                'key' => $api_key,
                'part' => 'snippet, brandingSettings'
            ]
        ]);

        $channel_details = json_decode($response->getBody(), true)['items'][0]['snippet'];
        $channel_brands = json_decode($response->getBody(), true)['items'][0]['brandingSettings'];
        $channel = HmChannel::firstOrCreate(
            ['channel_id' => $channel_id],
            [
                'user_id' => Auth::id(),
                'approval_status_id' => HmApprovalStatus::SUBMITTED,
                'title' => $channel_details['title'],
                'slug' => SlugGenerator::generateUniqueSlug($channel_details['title'], HmChannel::class),
                'description' => $channel_details['description'],
                'published_at' => Carbon::parse($channel_details['publishedAt'])->format('Y-m-d'),
                'handle' => $channel_details['customUrl'],
                'thumbnail_default' => $channel_details['thumbnails']['default']['url'],
                'thumbnail_medium' => $channel_details['thumbnails']['medium']['url'],
                'thumbnail_high' => $channel_details['thumbnails']['high']['url'],
                'cover_image' => $channel_brands['image']['bannerExternalUrl'] ?? null,
                'country' => $channel_details['country'] ?? null,
                'keywords' => $channel_details['keywords'] ?? null
            ]
        );

        // Store the data in the database
        $hymn = HmHymn::create([
            'user_id' => Auth::id(),
            'approval_status_id' => HmApprovalStatus::SUBMITTED,
            'channel_id' => $channel->id,
            'video_id' => $video_id,
            'published_at' => Carbon::parse($video_details['publishedAt'])->format('Y-m-d H:i:s'),
            'singer' => $request->singer,
            'title' => $video_details['title'],
            'slug' => SlugGenerator::generateUniqueSlug($video_details['title'], HmHymn::class),
            'lyrics' => $request->lyrics,
            'description' => $request->description,
            'thumbnail_default' => $video_details['thumbnails']['default']['url'],
            'thumbnail_medium' => $video_details['thumbnails']['medium']['url'],
            'thumbnail_high' => $video_details['thumbnails']['high']['url'],
            'thumbnail_standard' => $video_details['thumbnails']['standard']['url'] ?? null,
            'thumbnail_maxres' => $video_details['thumbnails']['maxres']['url'] ?? null,
            'clicks_count' => 0
        ]);

        $hymn->languages()->attach($request->language_id);
        $hymn->categories()->attach($request->category_id);
        $hymn->sub_categories()->attach($request->sub_category_id);

        return redirect(route('hymn.user.hymns.index'));
    }
}
