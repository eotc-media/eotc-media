<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmFavorite extends Model
{
    protected $table = 'hm_favorites';

    public function hymn()
    {
        return $this->belongsTo(HmHymn::class, `hymn_id`);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
