'use client'

import { useState } from 'react'
import { Box, Stepper, Step, StepLabel, Typography, Paper } from '@mui/material'
import LocationStep from './LocationStep'
import ServiceStep from './ServiceStep'
import StaffTimeStep from './StaffTimeStep'
import ContactStep from './ContactStep'
import ConfirmationScreen from './ConfirmationScreen'
import type { Tenant, Location, Service, Staff } from '@/types/database'

type BookingState = {
  location: Location | null
  service: Service | null
  staff: Staff | null
  date: string   // 'YYYY-MM-DD'
  time: string   // 'HH:MM'
}

const STEPS = ['Location', 'Service', 'Staff & Time', 'Your Details']

export default function BookingWizard({ tenant }: { tenant: Tenant }) {
  const [activeStep, setActiveStep] = useState(0)
  const [booking, setBooking] = useState<BookingState>({
    location: null,
    service: null,
    staff: null,
    date: '',
    time: '',
  })
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  function goNext() {
    setActiveStep((s) => s + 1)
  }

  function goBack() {
    setActiveStep((s) => s - 1)
  }

  if (appointmentId) {
    return (
      <ConfirmationScreen
        tenant={tenant}
        booking={booking}
        appointmentId={appointmentId}
      />
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: 'background.default',
        py: { xs: 2, md: 2.5 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
            {tenant.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Book your appointment in just a few steps
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 2.5 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          {activeStep === 0 && (
            <LocationStep
              tenantId={tenant.id}
              selected={booking.location}
              onSelect={(loc) => {
                setBooking((b) => ({ ...b, location: loc, service: null, staff: null, date: '', time: '' }))
                goNext()
              }}
            />
          )}
          {activeStep === 1 && (
            <ServiceStep
              tenantId={tenant.id}
              locationId={booking.location!.id}
              selected={booking.service}
              onSelect={(svc) => {
                setBooking((b) => ({ ...b, service: svc, staff: null, date: '', time: '' }))
                goNext()
              }}
              onBack={goBack}
            />
          )}
          {activeStep === 2 && (
            <StaffTimeStep
              tenantId={tenant.id}
              locationId={booking.location!.id}
              serviceId={booking.service!.id}
              durationMinutes={booking.service!.duration_min}
              selectedStaff={booking.staff}
              selectedDate={booking.date}
              selectedTime={booking.time}
              onSelect={({ staff, date, time }) => {
                setBooking((b) => ({ ...b, staff, date, time }))
                goNext()
              }}
              onBack={goBack}
            />
          )}
          {activeStep === 3 && (
            <ContactStep
              tenant={tenant}
              booking={booking}
              onBack={goBack}
              onConfirmed={(id) => setAppointmentId(id)}
            />
          )}
        </Paper>
      </Box>
    </Box>
  )
}
