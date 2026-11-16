'use client'

import { Box, Typography, Button } from '@mui/material'
import { CheckCircle as CheckCircleIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { Tenant, Location, Service, Staff } from '@/types/database'

interface BookingData {
  location: Location | null
  service: Service | null
  staff: Staff | null
  date: string
  time: string
}

interface ConfirmationScreenProps {
  tenant: Tenant
  booking: BookingData
  appointmentId: string
}

export default function ConfirmationScreen({
  tenant,
  booking,
  appointmentId,
}: ConfirmationScreenProps) {
  const startsAt =
    booking.date && booking.time
      ? new Date(`${booking.date}T${booking.time}:00`)
      : null

  const tz = booking.location?.timezone

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Success icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'success.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
        </Box>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          You&apos;re booked!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your appointment at <strong>{tenant.name}</strong> has been confirmed.
          A confirmation email is on its way.
        </Typography>

        {/* Booking details card */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'left',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <CalendarIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Appointment Details
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 1,
              rowGap: 0.75,
            }}
          >
            <Typography variant="body2" color="text.secondary">Service</Typography>
            <Typography variant="body2" fontWeight={600}>{booking.service?.name}</Typography>

            <Typography variant="body2" color="text.secondary">Duration</Typography>
            <Typography variant="body2" fontWeight={600}>
              {booking.service ? formatDuration(booking.service.duration_min) : '—'}
            </Typography>

            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography variant="body2" fontWeight={600}>
              {startsAt ? formatDate(startsAt, tz) : '—'}
            </Typography>

            <Typography variant="body2" color="text.secondary">Time</Typography>
            <Typography variant="body2" fontWeight={600}>
              {startsAt ? formatTime(startsAt, tz) : '—'}
            </Typography>

            <Typography variant="body2" color="text.secondary">Location</Typography>
            <Box>
              <Typography variant="body2" fontWeight={600}>{booking.location?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{booking.location?.address}</Typography>
            </Box>

            {booking.staff && (
              <>
                <Typography variant="body2" color="text.secondary">Staff</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {booking.staff.first_name} {booking.staff.last_name}
                </Typography>
              </>
            )}

            <Typography variant="body2" color="text.secondary">Booking ID</Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              {appointmentId.slice(0, 8)}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="large"
          onClick={() => window.location.href = `/${tenant.slug}/book`}
        >
          Book Another Appointment
        </Button>
      </Box>
    </Box>
  )
}
