import { createHash, randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// Reset links live in NextAuth's verification_tokens table. Only a hash of the
// token is stored, so the table alone cannot be used to reset anyone's
// password; the token itself exists only in the email.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eotcmedia.com"
const TTL_MS = 60 * 60 * 1000 // a link works for one hour
const RESEND_AFTER_MS = 2 * 60 * 1000 // and is not re-sent within two minutes

const identifierFor = (userId: number) => `password-reset:${userId}`
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

/**
 * Emails a reset link if the address belongs to an account. Says nothing either
 * way, so the form cannot be used to find out who has an account.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  })
  if (!user) return

  const identifier = identifierFor(user.id)
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date(Date.now() + TTL_MS - RESEND_AFTER_MS) } },
  })
  if (recent) return

  const token = randomBytes(32).toString("hex")
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(Date.now() + TTL_MS) },
    }),
  ])

  const link = `${SITE_URL}/auth/reset-password?token=${token}`
  const firstName = user.name?.trim().split(/\s+/)[0] ?? ""
  const result = await sendEmail({
    to: user.email,
    subject: "የይለፍ ቃል መቀየሪያ · Reset your password — EOTC Media",
    htmlContent: resetHtml(link, firstName),
    textContent: resetText(link, firstName),
  })
  if (!result.ok) console.error("password reset email failed:", result.error)
}

/** Sets a new password if the token is valid and unused. */
export async function resetPassword(token: string, password: string): Promise<"ok" | "invalid"> {
  const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } })
  if (!record || !record.identifier.startsWith("password-reset:")) return "invalid"
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } })
    return "invalid"
  }

  const userId = Number(record.identifier.slice("password-reset:".length))
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
  ])
  return "ok"
}

function resetHtml(link: string, firstName: string): string {
  const hiAm = firstName ? `ሰላም ${firstName}፣` : "ሰላም፣"
  const hiEn = firstName ? `Hi ${firstName},` : "Hello,"
  const button = (label: string) =>
    `<a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px">${label}</a>`
  return `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
      <p style="margin:0 0 12px">${hiAm}</p>
      <p style="margin:0 0 20px;line-height:1.6">የይለፍ ቃልዎን ለመቀየር ጥያቄ ቀርቧል። አዲስ የይለፍ ቃል ለማስገባት ከታች ያለውን ይጫኑ። ሊንኩ ለአንድ ሰዓት ብቻ ያገለግላል።</p>
      <p style="margin:0 0 28px">${button("የይለፍ ቃል ይቀይሩ")}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">
      <p style="margin:0 0 12px">${hiEn}</p>
      <p style="margin:0 0 20px;line-height:1.6">We received a request to reset your password. Use the button below to choose a new one. The link works for one hour.</p>
      <p style="margin:0 0 24px">${button("Reset password")}</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">ይህን ጥያቄ ካላቀረቡ ኢሜይሉን ችላ ይበሉት፤ የይለፍ ቃልዎ አይቀየርም።<br>If you didn't ask for this, ignore this email; your password stays the same.</p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#94a3b8">EOTC Media · eotcmedia.com</p>
  </div>
</body></html>`
}

function resetText(link: string, firstName: string): string {
  return [
    firstName ? `ሰላም ${firstName}፣` : "ሰላም፣",
    "የይለፍ ቃልዎን ለመቀየር ይህን ሊንክ ይክፈቱ (ለአንድ ሰዓት ያገለግላል)፦",
    link,
    "",
    firstName ? `Hi ${firstName},` : "Hello,",
    "Open this link to choose a new password (it works for one hour):",
    link,
    "",
    "If you didn't ask for this, ignore this email; your password stays the same.",
  ].join("\n")
}
