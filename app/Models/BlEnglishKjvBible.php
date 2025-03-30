<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlEnglishKjvBible extends Model
{
    protected $table = 'bl_english_kjv_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
