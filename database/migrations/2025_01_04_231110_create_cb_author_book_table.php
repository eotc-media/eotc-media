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
        Schema::create('cb_author_book', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('cb_authors');
            $table->foreignId('book_id')->constrained('cb_books');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cb_author_book');
    }
};
