<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Super Admin',
            'Admin',
            'Book Languages Manager',
            'Book Categories Manager',
            'Book Sub Categories Manager',
            'Books Manager',
            'Hymn Languages Manager',
            'Hymn Categories Manager',
            'Hymn Sub Categories Manager',
            'Hymns Manager',
            'Subscriber',
        ];

        foreach ($roles as $value) {
            $role = new Role();
            $role->name = $value;
            $role->save();
        }
    }
}
