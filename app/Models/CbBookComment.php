<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbBookComment extends Model
{
    protected $fillable = [
        'body'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(CbBook::class, 'book_id');
    }

    public function replies()
    {
        return $this->hasMany(CbBookComment::class, 'parent_id');
    }
}
