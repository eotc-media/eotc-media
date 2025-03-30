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
        Schema::create('bl_greek_textus_receptus_bible', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('bl_books');
            $table->integer('chapter');
            $table->integer('verse');
            $table->text('text');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bl_greek_textus_receptus_bible');
    }
};
