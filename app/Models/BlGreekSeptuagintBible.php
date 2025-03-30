<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlGreekSeptuagintBible extends Model
{
    protected $table = 'bl_greek_septuagint_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
