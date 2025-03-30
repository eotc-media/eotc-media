<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlHebrewMasoreticBible extends Model
{
    protected $table = 'bl_hebrew_masoretic_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
