<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmSubCategory extends Model
{
    protected $table = 'hm_sub_categories';

    protected $fillable = [
        'category_id',
        'name',
    ];

    public function category()
    {
        return $this->belongsTo(HmCategory::class, 'category_id');
    }
}
