-- The daily channel check: every new video it looks at on the sermon
-- channels, with Gemini's verdict, so each video is judged once and an admin
-- can see what was passed over. A video judged to be a sermon is added as a
-- pending sermon (sermon_id). Added: one table. Nothing existing changes.
-- Safe to run twice.

CREATE TABLE IF NOT EXISTS "sm_channel_videos" (
    "id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "video_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    -- "sermon" or "not_sermon"
    "verdict" TEXT NOT NULL,
    "reason" TEXT,
    "sermon_id" INTEGER,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sm_channel_videos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sm_channel_videos_video_id_key" ON "sm_channel_videos"("video_id");
CREATE INDEX IF NOT EXISTS "sm_channel_videos_checked_at_idx" ON "sm_channel_videos"("checked_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_channel_videos_channel_id_fkey') THEN
    ALTER TABLE "sm_channel_videos" ADD CONSTRAINT "sm_channel_videos_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "sm_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_channel_videos_sermon_id_fkey') THEN
    ALTER TABLE "sm_channel_videos" ADD CONSTRAINT "sm_channel_videos_sermon_id_fkey" FOREIGN KEY ("sermon_id") REFERENCES "sm_sermons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
