<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmLanguage extends Model
{
    protected $table = 'hm_languages';

    protected $fillable = [
        'name',
    ];

    public function categories()
    {
        return $this->hasMany(HmCategory::class, 'language_id');
    }
}
