<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbLanguage extends Model
{
    protected $fillable = [
        'name',
        'slug',
    ];

    public function categories()
    {
        return $this->hasMany(CbCategory::class, 'language_id');
    }
}
