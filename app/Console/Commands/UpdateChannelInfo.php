<?php

namespace App\Console\Commands;

use App\Models\HmChannel;
use GuzzleHttp\Client;
use Illuminate\Console\Command;

class UpdateChannelInfo extends Command
{
    protected $signature = 'channels:update';
    protected $description = 'Update channel information weekly using YouTube API';

    public function handle()
    {
        $api_key = env('YOUTUBE_API_KEY');
        $client = new Client();

        // Get all channels
        $channels = HmChannel::all();

        foreach ($channels as $channel) {
            try {
                // Fetch updated channel details
                $response = $client->get('https://www.googleapis.com/youtube/v3/channels', [
                    'query' => [
                        'id' => $channel->channel_id,
                        'key' => $api_key,
                        'part' => 'snippet,brandingSettings'
                    ]
                ]);

                $data = json_decode($response->getBody(), true)['items'][0];
                $channel_details = $data['snippet'];
                $channel_brands = $data['brandingSettings'];

                // Update channel details in the database
                $channel->update([
                    'title' => $channel_details['title'],
                    'description' => $channel_details['description'],
                    'thumbnail_default' => $channel_details['thumbnails']['default']['url'],
                    'thumbnail_medium' => $channel_details['thumbnails']['medium']['url'],
                    'thumbnail_high' => $channel_details['thumbnails']['high']['url'],
                    'cover_image' => $channel_brands['image']['bannerExternalUrl'] ?? $channel->cover_image,
                    'country' => $channel_details['country'] ?? $channel->country,
                ]);

                $this->info("Updated channel: {$channel->title}");
            } catch (\Exception $e) {
                $this->error("Failed to update channel: {$channel->channel_id}, Error: " . $e->getMessage());
            }
        }
    }
}
