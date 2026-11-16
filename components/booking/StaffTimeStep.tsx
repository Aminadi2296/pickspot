'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Chip,
  Alert,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/types/database'

interface StaffTimeStepProps {
  tenantId: string
  locationId: string
  serviceId: string
  durationMinutes: number
  selectedStaff: Staff | null
  selectedDate: string
  selectedTime: string
  onSelect: (params: { staff: Staff | null; date: string; time: string }) => void
  onBack: () => void
}

export default function StaffTimeStep({
  tenantId,
  locationId,
  serviceId,
  selectedStaff,
  selectedDate,
  selectedTime,
  onSelect,
  onBack,
}: StaffTimeStepProps) {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [staff, setStaff] = useState<Staff | null>(selectedStaff)
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(selectedTime)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Min date = today
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const supabase = createClient()
    // Get staff who can perform this service at this location
    supabase
      .from('staff_services')
      .select('staff_id')
      .eq('service_id', serviceId)
      .then(async ({ data: ssData }) => {
        const staffIds = (ssData ?? []).map((s) => s.staff_id)
        if (staffIds.length === 0) { setLoadingStaff(false); return }

        const { data: slData } = await supabase
          .from('staff_locations')
          .select('staff_id')
          .eq('location_id', locationId)
          .in('staff_id', staffIds)

        const eligibleIds = (slData ?? []).map((s) => s.staff_id)
        if (eligibleIds.length === 0) { setLoadingStaff(false); return }

        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .in('id', eligibleIds)
          .eq('is_active', true)
          .eq('tenant_id', tenantId)

        setStaffList((staffData as Staff[]) ?? [])
        setLoadingStaff(false)
      })
  }, [tenantId, locationId, serviceId])

  const fetchSlots = useCallback(async (staffId: string | null, dateStr: string) => {
    if (!dateStr) return
    setLoadingSlots(true)
    setSlotsError(null)
    setTime('')

    try {
      const params = new URLSearchParams({
        locationId,
        serviceId,
        date: dateStr,
        ...(staffId ? { staffId } : {}),
      })
      const res = await fetch(`/api/slots?${params}`)
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlotsError('Could not load available times. Please try again.')
    } finally {
      setLoadingSlots(false)
    }
  }, [locationId, serviceId])

  useEffect(() => {
    if (date) {
      fetchSlots(staff?.id ?? null, date)
    }
  }, [staff, date, fetchSlots])

  function formatSlotDisplay(slot: string) {
    const [h, m] = slot.split(':').map(Number)
    const period = h < 12 ? 'am' : 'pm'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  }

  const canContinue = date && time

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Choose Staff & Time</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Pick a team member, date, and available time slot.</Typography>

      {/* Staff selection */}
      {loadingStaff ? (
        <CircularProgress size={24} />
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Select Staff</Typography>
          <Grid container spacing={1.5}>
            <Grid>
              <Card
                variant={staff === null ? 'elevation' : 'outlined'}
                sx={{ borderColor: staff === null ? 'primary.main' : 'divider', borderWidth: staff === null ? 2 : 1 }}
              >
                <CardActionArea onClick={() => setStaff(null)} sx={{ px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.light' }}>✦</Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Any Available</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
            {staffList.map((s) => (
              <Grid key={s.id}>
                <Card
                  variant={staff?.id === s.id ? 'elevation' : 'outlined'}
                  sx={{ borderColor: staff?.id === s.id ? 'primary.main' : 'divider', borderWidth: staff?.id === s.id ? 2 : 1 }}
                >
                  <CardActionArea onClick={() => setStaff(s)} sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={s.avatar_url ?? undefined}
                        sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 14 }}
                      >
                        {s.first_name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {s.first_name} {s.last_name}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Date picker */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Select Date</Typography>
        <TextField
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputProps={{ min: today }}
          size="small"
          sx={{ maxWidth: 200 }}
          InputLabelProps={{ shrink: true }}
          label="Date"
        />
      </Box>

      {/* Time slots */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Available Times</Typography>
        {loadingSlots ? (
          <CircularProgress size={24} />
        ) : slotsError ? (
          <Alert severity="error">{slotsError}</Alert>
        ) : slots.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No available times on this date.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {slots.map((slot) => (
              <Chip
                key={slot}
                label={formatSlotDisplay(slot)}
                onClick={() => setTime(slot)}
                color={time === slot ? 'primary' : 'default'}
                variant={time === slot ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="text" color="inherit">
          Back
        </Button>
        <Button
          endIcon={<ArrowForwardIcon />}
          variant="contained"
          disabled={!canContinue}
          onClick={() => onSelect({ staff, date, time })}
        >
          Continue
        </Button>
      </Box>
    </Box>
  )
}
