'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { StaffSchedule } from '@/types/database'

type DaySchedule = {
  day_of_week: number
  is_working: boolean
  start_time: string
  end_time: string
  break_start: string
  break_end: string
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_DAY = (day: number): DaySchedule => ({
  day_of_week: day,
  is_working: day >= 1 && day <= 5,
  start_time: '09:00',
  end_time: '17:00',
  break_start: '12:00',
  break_end: '13:00',
})

export default function EmployeeSchedulePage() {
  const { supabase, user } = useSupabase()
  const [staffId, setStaffId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    Array.from({ length: 7 }, (_, i) => DEFAULT_DAY(i))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [readOnly] = useState(false)

  useEffect(() => {
    if (!user) return
    async function init() {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (!staffData) { setLoading(false); return }
      setStaffId(staffData.id)

      const { data: slData } = await supabase
        .from('staff_locations')
        .select('location_id')
        .eq('staff_id', staffData.id)
        .limit(1)
        .single()

      if (!slData) { setLoading(false); return }
      setLocationId(slData.location_id)

      const { data: schedData } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staffData.id)
        .eq('location_id', slData.location_id)

      if (schedData && schedData.length > 0) {
        setSchedule(
          Array.from({ length: 7 }, (_, i) => {
            const ex = (schedData as StaffSchedule[]).find((d) => d.day_of_week === i)
            return ex
              ? { day_of_week: i, is_working: ex.is_working, start_time: ex.start_time, end_time: ex.end_time, break_start: ex.break_start ?? '', break_end: ex.break_end ?? '' }
              : DEFAULT_DAY(i)
          })
        )
      }

      setLoading(false)
    }
    init()
  }, [user, supabase])

  function updateDay(dayIndex: number, patch: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => (d.day_of_week === dayIndex ? { ...d, ...patch } : d)))
  }

  async function handleSave() {
    if (!staffId || !locationId) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const rows = schedule.map((d) => ({
      staff_id: staffId,
      location_id: locationId,
      day_of_week: d.day_of_week as StaffSchedule['day_of_week'],
      is_working: d.is_working,
      start_time: d.start_time,
      end_time: d.end_time,
      break_start: d.break_start || null,
      break_end: d.break_end || null,
    }))

    await supabase.from('staff_schedules').delete().eq('staff_id', staffId).eq('location_id', locationId)
    const { error: err } = await supabase.from('staff_schedules').insert(rows)

    if (err) setError(err.message)
    else setSaved(true)
    setSaving(false)
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Schedule</Typography>
        <Typography variant="body2" color="text.secondary">
          Your working hours for each day of the week.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Schedule saved successfully!</Alert>}
      {readOnly && <Alert severity="info" sx={{ mb: 2 }}>Contact your manager to change your schedule.</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {schedule.map((day) => (
          <Card key={day.day_of_week} variant="outlined">
            <CardContent>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={day.is_working}
                        onChange={(e) => updateDay(day.day_of_week, { is_working: e.target.checked })}
                        disabled={readOnly}
                      />
                    }
                    label={<Typography sx={{ fontWeight: 600 }}>{DAY_NAMES[day.day_of_week]}</Typography>}
                  />
                </Grid>
                {day.is_working ? (
                  <>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField label="Start" type="time" value={day.start_time} onChange={(e) => updateDay(day.day_of_week, { start_time: e.target.value })} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} disabled={readOnly} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField label="End" type="time" value={day.end_time} onChange={(e) => updateDay(day.day_of_week, { end_time: e.target.value })} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} disabled={readOnly} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField label="Break Start" type="time" value={day.break_start} onChange={(e) => updateDay(day.day_of_week, { break_start: e.target.value })} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} disabled={readOnly} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField label="Break End" type="time" value={day.break_end} onChange={(e) => updateDay(day.day_of_week, { break_end: e.target.value })} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} disabled={readOnly} />
                    </Grid>
                  </>
                ) : (
                  <Grid size="grow">
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Day off</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!readOnly && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving…' : 'Save Schedule'}
          </Button>
        </Box>
      )}
    </Box>
  )
}
