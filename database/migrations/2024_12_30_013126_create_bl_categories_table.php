<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bl_categories', function (Blueprint $table) {
            $table->id();
            $table->string('english_name');
            $table->string('geez_name');
            $table->string('amharic_name');
            $table->string('oromifa_name');
            $table->string('tigrigna_name');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bl_categories');
    }
};
