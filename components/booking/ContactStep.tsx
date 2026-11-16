'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { formatDate, formatTime } from '@/lib/utils'
import type { Tenant, Location, Service, Staff } from '@/types/database'

interface BookingData {
  location: Location | null
  service: Service | null
  staff: Staff | null
  date: string
  time: string
}

interface ContactStepProps {
  tenant: Tenant
  booking: BookingData
  onBack: () => void
  onConfirmed: (appointmentId: string) => void
}

export default function ContactStep({
  tenant,
  booking,
  onBack,
  onConfirmed,
}: ContactStepProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startsAt = booking.date && booking.time
    ? new Date(`${booking.date}T${booking.time}:00`)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startsAt || !booking.location || !booking.service) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          locationId: booking.location.id,
          serviceId: booking.service.id,
          staffId: booking.staff?.id ?? null,
          guestName: name,
          guestEmail: email,
          guestPhone: phone || null,
          notes: notes || null,
          startsAt: startsAt.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      onConfirmed(data.appointmentId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Your Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Almost done — just fill in your contact info.
      </Typography>

      {/* Summary */}
      <Box
        sx={{
          bgcolor: 'primary.50',
          border: '1px solid',
          borderColor: 'primary.100',
          borderRadius: 2,
          p: 2,
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Booking Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Service:</Typography>
          <Typography variant="caption" fontWeight={600}>{booking.service?.name}</Typography>
          <Typography variant="caption" color="text.secondary">Date:</Typography>
          <Typography variant="caption" fontWeight={600}>
            {startsAt ? formatDate(startsAt, booking.location?.timezone) : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">Time:</Typography>
          <Typography variant="caption" fontWeight={600}>
            {startsAt ? formatTime(startsAt, booking.location?.timezone) : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">Location:</Typography>
          <Typography variant="caption" fontWeight={600}>{booking.location?.name}</Typography>
          {booking.staff && (
            <>
              <Typography variant="caption" color="text.secondary">Staff:</Typography>
              <Typography variant="caption" fontWeight={600}>
                {booking.staff.first_name} {booking.staff.last_name}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          autoComplete="name"
        />
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          autoComplete="tel"
        />
        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Any special requests or information for the team?"
        />

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="text"
            color="inherit"
            type="button"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckIcon />
              )
            }
            sx={{ flex: 1 }}
          >
            {submitting ? 'Confirming…' : 'Confirm Booking'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
