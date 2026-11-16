import { Resend } from 'resend'
import { formatDate, formatTime } from '@/lib/utils'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pickspot.app'

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
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .header { background: #6366f1; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px 24px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e4e4e7; }
          .detail-label { color: #71717a; font-size: 14px; }
          .detail-value { font-weight: 600; font-size: 14px; }
          .footer { background: #f4f4f5; padding: 16px 24px; text-align: center; color: #a1a1aa; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed ✓</h1>
          </div>
          <div class="body">
            <p>Hi ${guestName},</p>
            <p>Your appointment at <strong>${businessName}</strong> has been confirmed. Here are the details:</p>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Staff</span>
              <span class="detail-value">${staffName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${dateStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${timeStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">${locationName}<br/><small>${locationAddress}</small></span>
            </div>
            <p style="margin-top: 24px; color: #71717a; font-size: 14px;">
              Need to cancel or reschedule? Please contact ${businessName} directly.
            </p>
          </div>
          <div class="footer">
            Powered by Pickspot — ${new Date().getFullYear()}
          </div>
        </div>
      </body>
    </html>
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Confirmed: ${serviceName} at ${businessName}`,
    html,
  })
}

export async function sendBusinessNotification(params: {
  to: string
  businessName: string
  guestName: string
  guestPhone: string
  serviceName: string
  staffName: string
  startsAt: Date
  timezone: string
}) {
  const {
    to,
    businessName,
    guestName,
    guestPhone,
    serviceName,
    staffName,
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
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .header { background: #6366f1; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px 24px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e4e4e7; }
          .detail-label { color: #71717a; font-size: 14px; }
          .detail-value { font-weight: 600; font-size: 14px; }
          .footer { background: #f4f4f5; padding: 16px 24px; text-align: center; color: #a1a1aa; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking 🎉</h1>
          </div>
          <div class="body">
            <p>A new appointment has been booked at <strong>${businessName}</strong>.</p>
            <div class="detail-row">
              <span class="detail-label">Guest</span>
              <span class="detail-value">${guestName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${guestPhone}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Staff</span>
              <span class="detail-value">${staffName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${dateStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${timeStr}</span>
            </div>
          </div>
          <div class="footer">
            Powered by Pickspot — ${new Date().getFullYear()}
          </div>
        </div>
      </body>
    </html>
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New Booking: ${guestName} — ${serviceName} on ${dateStr}`,
    html,
  })
}
