<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmCategory extends Model
{
    protected $table = 'hm_categories';

    protected $fillable = [
        'language_id',
        'name',
    ];

    public function language()
    {
        return $this->belongsTo(HmLanguage::class, 'language_id');
    }

    public function sub_categories()
    {
        return $this->hasMany(HmSubCategory::class, 'category_id');
    }
}
