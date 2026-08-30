import { prisma } from "@/lib/prisma"
import { sendCampaign } from "@/lib/email"
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eotcmedia.com"

/**
 * Send the next day's batch of one campaign.
 *
 * Called once when a campaign is created — so the sender sees it work rather
 * than waiting a day to find out — and once a day after that by the cron.
 */
export async function deliverNextBatch(campaignId: number): Promise<{
  sent: number
  failed: number
  skipped: number
  remaining: number
  error?: string | null
}> {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign || campaign.status !== "running") {
    return { sent: 0, failed: 0, skipped: 0, remaining: 0 }
  }

  const pending = await prisma.emailCampaignRecipient.findMany({
    where: { campaignId, sentAt: null },
    orderBy: { id: "asc" },
    take: campaign.batchSize,
    select: { id: true, userId: true, email: true, name: true },
  })

  if (pending.length === 0) {
    await prisma.emailCampaign.update({ where: { id: campaignId }, data: { status: "done" } })
    return { sent: 0, failed: 0, skipped: 0, remaining: 0 }
  }

  // The list was frozen when the campaign was created, so anyone who has
  // unsubscribed since then is still on it. Drop them here rather than at
  // creation — the whole point of spreading a send over days is that days pass.
  const optedOut = await prisma.user.findMany({
    where: { id: { in: pending.map(p => p.userId) }, emailOptOut: true },
    select: { id: true },
  })
  const optedOutIds = new Set(optedOut.map(u => u.id))

  if (optedOutIds.size > 0) {
    await prisma.emailCampaignRecipient.updateMany({
      where: { campaignId, userId: { in: [...optedOutIds] } },
      data: { sentAt: new Date(), error: "Skipped — member unsubscribed" },
    })
  }

  const toSend = pending.filter(p => !optedOutIds.has(p.userId))

  let sent = 0
  let failed = 0
  let error: string | null = null

  if (toSend.length > 0) {
    const result = await sendCampaign({
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent,
      recipients: toSend.map(r => ({
        email: r.email,
        name: r.name,
        unsubscribeUrl: `${SITE_URL}/unsubscribe?token=${generateUnsubscribeToken(r.userId)}`,
      })),
    })
    sent = result.sent
    failed = result.failed
    error = result.error

    // Marked only when something actually went out. A batch that failed
    // outright stays pending, so a bad key or an outage is retried tomorrow
    // instead of being recorded as delivered.
    if (sent > 0) {
      await prisma.emailCampaignRecipient.updateMany({
        where: { id: { in: toSend.map(r => r.id) } },
        data: { sentAt: new Date(), error },
      })
    }
  }

  const remaining = await prisma.emailCampaignRecipient.count({
    where: { campaignId, sentAt: null },
  })
  if (remaining === 0) {
    await prisma.emailCampaign.update({ where: { id: campaignId }, data: { status: "done" } })
  }

  return { sent, failed, skipped: optedOutIds.size, remaining, error }
}
