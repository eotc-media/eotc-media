<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmChannel extends Model
{
    protected $table = 'hm_channels';

    protected $fillable = [
        'user_id',
        'approval_status_id',
        'channel_id',
        'title',
        'slug',
        'description',
        'published_at',
        'handle',
        'thumbnail_default',
        'thumbnail_medium',
        'thumbnail_high',
        'cover_image',
        'country',
        'keywords'
    ];

    public function hymns()
    {
        return $this->hasMany(HmHymn::class, 'channel_id');
    }

    public function accepted_hymns()
    {
        return $this->hasMany(HmHymn::class, 'channel_id')->where('approval_status_id', HmApprovalStatus::ACCEPTED);
    }
}
