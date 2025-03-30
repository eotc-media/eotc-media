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
        Schema::create('hm_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('approval_status_id')->constrained('hm_approval_statuses');
            $table->string('channel_id')->unique();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->date('published_at')->nullable();
            $table->string('handle');
            $table->string('thumbnail_default')->nullable();
            $table->string('thumbnail_medium')->nullable();
            $table->string('thumbnail_high')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('country')->nullable();
            $table->text('keywords')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hm_channels');
    }
};
