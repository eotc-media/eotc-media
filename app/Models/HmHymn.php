<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmHymn extends Model
{
    protected $table = 'hm_hymns';

    protected $fillable = [
        'user_id',
        'approval_status_id',
        'channel_id',
        'video_id',
        'published_at',
        'singer',
        'title',
        'slug',
        'lyrics',
        'lyrics_suggestion',
        'description',
        'thumbnail_default',
        'thumbnail_medium',
        'thumbnail_high',
        'thumbnail_standard',
        'thumbnail_maxres',
        'clicks_count',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function languages()
    {
        return $this->belongsToMany(HmLanguage::class, 'hm_hymn_language', 'hymn_id', 'language_id');
    }

    public function categories()
    {
        return $this->belongsToMany(HmCategory::class, 'hm_category_hymn', 'hymn_id', 'category_id');
    }

    public function sub_categories()
    {
        return $this->belongsToMany(HmSubCategory::class, 'hm_hymn_sub_category', 'hymn_id', 'sub_category_id');
    }

    public function approval_status()
    {
        return $this->belongsTo(HmApprovalStatus::class, 'approval_status_id');
    }

    public function channel()
    {
        return $this->belongsTo(HmChannel::class, 'channel_id');
    }

    public function singers()
    {
        return $this->belongsToMany(HmSinger::class, 'hm_hymn_singer', 'hymn_id', 'singer_id');
    }

    public function favors()
    {
        return $this->belongsToMany(User::class, 'hm_favorites', 'hymn_id', 'user_id');
    }
}
