<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HmApprovalStatus extends Model
{
    protected $table = 'hm_approval_statuses';

    public const SUBMITTED = 1;
    public const ACCEPTED = 2;
    public const DECLINED = 3;

    protected $fillable = [
        'name',
    ];
}
