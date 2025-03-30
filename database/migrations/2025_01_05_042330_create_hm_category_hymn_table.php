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
        Schema::create('hm_category_hymn', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hymn_id')->constrained('hm_hymns')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('hm_categories')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hm_category_hymn');
    }
};
