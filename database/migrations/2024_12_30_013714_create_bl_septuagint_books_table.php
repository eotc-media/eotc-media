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
        Schema::create('bl_septuagint_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('bl_categories');
            $table->foreignId('sub_category_id')->constrained('bl_sub_categories');
            $table->string('greek_name');
            $table->string('english_name');
            $table->string('greek_slug')->unique();
            $table->string('english_slug')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bl_septuagint_books');
    }
};
