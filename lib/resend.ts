import { Resend } from 'resend'
import { formatDate, formatTime } from '@/lib/utils'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function renderRow(label: string, value: string, isLast = false) {
  const border = isLast ? '' : 'border-bottom: 1px solid #e4e4e7;'
  return `
    <tr>
      <td style="padding: 12px 16px 12px 0; ${border} color: #71717a; font-size: 14px; vertical-align: top; width: 130px;">
        ${label}
      </td>
      <td style="padding: 12px 0; ${border} color: #18181b; font-size: 14px; font-weight: 600; text-align: right; vertical-align: top;">
        ${value}
      </td>
    </tr>
  `
}

export async function sendBookingConfirmation(params: {
  to: string
  guestName: string
  businessName: string
  serviceName: string
  staffName: string
  locationName: string
  locationAddress: string
  startsAt: Date
  timezone: string
}) {
  const {
    to,
    guestName,
    businessName,
    serviceName,
    staffName,
    locationName,
    locationAddress,
    startsAt,
    timezone,
  } = params

  const dateStr = formatDate(startsAt, timezone)
  const timeStr = formatTime(startsAt, timezone)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #55002D; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Booking Confirmed ✓</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px; color: #18181b; font-size: 15px; line-height: 1.5;">
              <p style="margin: 0 0 12px 0;">Hi ${guestName},</p>
              <p style="margin: 0 0 20px 0;">Your appointment at <strong>${businessName}</strong> has been confirmed. Here are the details:</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                ${renderRow('Service', serviceName)}
                ${renderRow('Staff', staffName)}
                ${renderRow('Date', dateStr)}
                ${renderRow('Time', timeStr)}
                ${renderRow('Location', `${locationName}<br/><span style="font-weight: 400; color: #71717a; font-size: 13px;">${locationAddress}</span>`, true)}
              </table>

              <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px;">
                Need to cancel or reschedule? Please contact ${businessName} directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 14px 24px; text-align: center; color: #a1a1aa; font-size: 12px;">
              Powered by Pickspot — ${new Date().getFullYear()}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Confirmed: ${serviceName} at ${businessName}`,
    html,
  })
  if (result.error) {
    console.error('[Resend] sendBookingConfirmation error:', result.error)
  }
  return result
}

export async function sendBusinessNotification(params: {
  to: string
  businessName: string
  guestName: string
  guestEmail: string
  guestPhone: string
  notes?: string | null
  serviceName: string
  staffName: string
  locationName: string
  locationAddress: string
  startsAt: Date
  timezone: string
}) {
  const {
    to,
    businessName,
    guestName,
    guestEmail,
    guestPhone,
    notes,
    serviceName,
    staffName,
    locationName,
    locationAddress,
    startsAt,
    timezone,
  } = params

  const dateStr = formatDate(startsAt, timezone)
  const timeStr = formatTime(startsAt, timezone)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>New Booking</title>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #55002D; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">New Booking 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px; color: #18181b; font-size: 15px; line-height: 1.5;">
              <p style="margin: 0 0 20px 0;">A new appointment has been booked at <strong>${businessName}</strong>.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                ${renderRow('Client', guestName)}
                ${renderRow('Email', guestEmail)}
                ${renderRow('Phone', guestPhone)}
                ${renderRow('Location', `${locationName}<br/><span style="font-weight: 400; color: #71717a; font-size: 13px;">${locationAddress}</span>`)}
                ${renderRow('Service', serviceName)}
                ${renderRow('Staff', staffName)}
                ${renderRow('Date', dateStr)}
                ${renderRow('Time', timeStr, !notes)}
                ${notes ? renderRow('Notes', notes, true) : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 14px 24px; text-align: center; color: #a1a1aa; font-size: 12px;">
              Powered by Pickspot — ${new Date().getFullYear()}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New Booking (${locationName}): ${guestName} — ${serviceName} on ${dateStr}`,
    html,
  })
  if (result.error) {
    console.error('[Resend] sendBusinessNotification error:', result.error)
  }
  return result
}
