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
        Schema::create('cb_book_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('cb_books');
            $table->foreignId('category_id')->constrained('cb_categories');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cb_book_category');
    }
};
