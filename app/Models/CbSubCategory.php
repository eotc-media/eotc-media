<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbSubCategory extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
    ];

    public function category()
    {
        return $this->belongsTo(CbCategory::class, 'category_id');
    }
}
