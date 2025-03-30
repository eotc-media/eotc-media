<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmSinger extends Model
{
    protected $table = 'hm_singers';

    protected $fillable = [
        'name',
    ];

    public function hymns()
    {
        return $this->belongsToMany(HmHymn::class, 'hm_hymn_singer', 'singer_id', 'hymn_id');
    }
}
