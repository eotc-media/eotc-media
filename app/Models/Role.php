<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public const SUPER_ADMIN = 1;
    public const ADMIN = 2;
    public const BOOK_LANGUAGES_MANAGER = 3;
    public const BOOK_CATEGORIES_MANAGER = 4;
    public const BOOK_SUB_CATEGORIES_MANAGER = 5;
    public const BOOKS_MANAGER = 6;
    public const HYMN_LANGUAGES_MANAGER = 7;
    public const HYMN_CATEGORIES_MANAGER = 8;
    public const HYMN_SUB_CATEGORIES_MANAGER = 9;
    public const HYMNS_MANAGER = 10;
    public const SUBSCRIBER = 11;

    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}
