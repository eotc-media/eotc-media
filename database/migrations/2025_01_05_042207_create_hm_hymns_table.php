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
        Schema::create('hm_hymns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('approval_status_id')->constrained('hm_approval_statuses');
            $table->foreignId('channel_id')->constrained('hm_channels');
            $table->string('slug')->unique();
            $table->string('video_id');
            $table->date('published_at')->nullable();
            $table->string('singer')->nullable();
            $table->string('title');
            $table->text('lyrics')->nullable();
            $table->text('lyrics_suggestion')->nullable();
            $table->text('description')->nullable();
            $table->string('thumbnail_default');
            $table->string('thumbnail_medium');
            $table->string('thumbnail_high');
            $table->string('thumbnail_standard')->nullable();
            $table->string('thumbnail_maxres')->nullable();
            $table->unsignedInteger('clicks_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hm_hymns');
    }
};
