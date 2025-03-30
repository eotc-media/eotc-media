<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbLike extends Model
{
    public function likable()
    {
        return $this->morphTo();
    }
}
