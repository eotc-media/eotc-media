<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlGreekTextusReceptusBible extends Model
{
    protected $table = 'bl_greek_textus_receptus_bible';

    public function book()
    {
        return $this->belongsTo(BlBook::class);
    }
}
