<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbBook extends Model
{
    protected $fillable = [
        'language_id',
        'category_id',
        'sub_category_id',
        'name',
        'slug',
        'author',
        'file',
        'image',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function languages()
    {
        return $this->belongsToMany(CbLanguage::class, 'cb_book_language', 'book_id', 'language_id');
    }

    public function categories()
    {
        return $this->belongsToMany(CbCategory::class, 'cb_book_category', 'book_id', 'category_id');
    }

    public function sub_categories()
    {
        return $this->belongsToMany(CbSubCategory::class, 'cb_book_sub_category', 'book_id', 'sub_category_id');
    }

    public function approval_status()
    {
        return $this->belongsTo(CbApprovalStatus::class, 'approval_status_id');
    }

    public function authors()
    {
        return $this->belongsToMany(CbAuthor::class, 'cb_author_book', 'book_id', 'author_id');
    }

    public function likes()
    {
        return $this->morphMany(CbLike::class,  'likable', 'likable_type', 'likable_id');
    }

    public function copyright_reports()
    {
        return $this->hasMany(CbCopyrightReport::class, 'book_id');
    }

    public function comments()
    {
        return $this->hasMany(CbBookComment::class, 'book_id')->whereNull('parent_id');
    }
}
