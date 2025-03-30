<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlOromifaBible extends Model
{
    protected $table = 'bl_oromifa_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
