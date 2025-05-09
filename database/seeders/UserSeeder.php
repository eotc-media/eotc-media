<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = new User();
        $user->name = 'Regular User';
        $user->email = 'ayennew@gmail.com';
        $user->password = Hash::make('12345678');
        $user->save();
        $user->roles()->attach(1);
    }
}
