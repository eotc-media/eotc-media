<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlAmharic1954Bible extends Model
{
    protected $table = 'bl_amharic_1954_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
