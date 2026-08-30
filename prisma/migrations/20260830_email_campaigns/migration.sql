-- Scheduled newsletter sends: a campaign and its frozen recipient list.
--
-- Only these two tables are created here. `prisma migrate diff` also reports
-- changes to hm_channels, hm_collections and qz_rounds, but those are drift —
-- the live database already has them from an earlier `db push` that was never
-- captured as a migration. Including them would try to re-apply what is there.

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "batch_size" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'running',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaign_recipients" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_campaign_recipients_campaign_id_sent_at_idx" ON "email_campaign_recipients"("campaign_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_campaign_recipients_campaign_id_user_id_key" ON "email_campaign_recipients"("campaign_id", "user_id");

-- AddForeignKey
ALTER TABLE "email_campaign_recipients" ADD CONSTRAINT "email_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
