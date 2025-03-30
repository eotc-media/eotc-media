<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbCategory extends Model
{
    protected $fillable = [
        'language_id',
        'name',
        'slug',
    ];

    public function language()
    {
        return $this->belongsTo(CbLanguage::class, 'language_id');
    }

    public function sub_categories()
    {
        return $this->hasMany(CbSubCategory::class, 'category_id');
    }
}
