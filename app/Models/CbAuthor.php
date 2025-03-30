<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbAuthor extends Model
{
    protected $fillable = [
        'name',
        'slug',
    ];

    public function books()
    {
        return $this->belongsToMany(CbBook::class, 'cb_author_book', 'author_id', 'book_id');
    }
}
