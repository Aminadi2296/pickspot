import twilio from 'twilio'
import { formatDate, formatTime } from '@/lib/utils'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER!

export async function sendSmsConfirmation(params: {
  to: string
  businessName: string
  serviceName: string
  startsAt: Date
  timezone: string
}) {
  const { to, businessName, serviceName, startsAt, timezone } = params
  const dateStr = formatDate(startsAt, timezone)
  const timeStr = formatTime(startsAt, timezone)

  const body =
    `✅ Booking confirmed at ${businessName}!\n` +
    `Service: ${serviceName}\n` +
    `Date: ${dateStr}\n` +
    `Time: ${timeStr}\n` +
    `Need help? Contact ${businessName} directly.`

  return client.messages.create({
    from: FROM_NUMBER,
    to,
    body,
  })
}

export async function sendSmsReminder(params: {
  to: string
  businessName: string
  startsAt: Date
  timezone: string
}) {
  const { to, businessName, startsAt, timezone } = params
  const dateStr = formatDate(startsAt, timezone)
  const timeStr = formatTime(startsAt, timezone)

  const body =
    `⏰ Reminder: You have an appointment at ${businessName} ` +
    `on ${dateStr} at ${timeStr}. See you soon!`

  return client.messages.create({
    from: FROM_NUMBER,
    to,
    body,
  })
}
