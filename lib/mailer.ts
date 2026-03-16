import nodemailer from "nodemailer"

type SendPasswordResetParams = {
  to: string
  resetUrl: string
}

type SendNudgeNotificationParams = {
  to: string
  childName: string
  goalName: string
  message?: string | null
  dashboardUrl: string
}

export async function sendPasswordResetEmail(params: SendPasswordResetParams): Promise<void> {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM

  if (!host || !user || !pass || !from) {
    throw new Error("Email service is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM).")
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to: params.to,
    subject: "Reset your CarrotNoStick password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="margin-top: 0;">Click the button below to set a new password.</p>
        <p style="margin: 20px 0;">
          <a href="${params.resetUrl}" style="background:#f59e0b;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendNudgeNotificationEmail(params: SendNudgeNotificationParams): Promise<void> {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM

  if (!host || !user || !pass || !from) return // silently skip if email not configured

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to: params.to,
    subject: `${params.childName} sent you a nudge! 🙋`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">🙋 ${params.childName} says "I did it!"</h2>
        <p style="margin-top: 0;"><strong>Goal:</strong> ${params.goalName}</p>
        ${params.message ? `<p style="color: #6b7280; font-style: italic;">"${params.message}"</p>` : ""}
        <p style="margin: 20px 0;">
          <a href="${params.dashboardUrl}" style="background:#f97316;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;">
            Open dashboard
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">— CarrotNoStick</p>
      </div>
    `,
  })
}
