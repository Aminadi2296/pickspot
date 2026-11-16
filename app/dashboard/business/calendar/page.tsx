'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Paper,
} from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
} from '@mui/icons-material'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { formatTime } from '@/lib/utils'
import type { Appointment, Service, Staff } from '@/types/database'

type AppointmentWithDetails = Appointment & {
  serviceName: string
  staffName: string
  guestName: string
}

const STATUS_COLORS: Record<string, 'primary' | 'error' | 'warning' | 'success' | 'default'> = {
  confirmed: 'primary',
  cancelled: 'error',
  no_show: 'warning',
  completed: 'success',
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am–9pm
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

export default function CalendarPage() {
  const { supabase, user } = useSupabase()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadAppointments = useCallback(async (tid: string, ws: Date) => {
    setLoading(true)
    const weekEnd = new Date(ws)
    weekEnd.setDate(ws.getDate() + 7)

    const [{ data: apptData }, { data: serviceData }, { data: staffData }] = await Promise.all([
      supabase.from('appointments').select('*').eq('tenant_id', tid).gte('starts_at', ws.toISOString()).lt('starts_at', weekEnd.toISOString()),
      supabase.from('services').select('id, name').eq('tenant_id', tid),
      supabase.from('staff').select('id, first_name, last_name').eq('tenant_id', tid),
    ])

    const enriched: AppointmentWithDetails[] = ((apptData as Appointment[]) ?? []).map((a) => {
      const svc = ((serviceData as Pick<Service, 'id' | 'name'>[]) ?? []).find((s) => s.id === a.service_id)
      const stf = ((staffData as Pick<Staff, 'id' | 'first_name' | 'last_name'>[]) ?? []).find((s) => s.id === a.staff_id)
      return {
        ...a,
        serviceName: svc?.name ?? 'Unknown',
        staffName: stf ? `${stf.first_name} ${stf.last_name}` : 'Unknown',
        guestName: a.guest_name,
      }
    })

    setAppointments(enriched)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!user) return
    supabase.from('user_roles').select('tenant_id').eq('user_id', user.id).single().then(({ data }) => {
      if (data?.tenant_id) { setTenantId(data.tenant_id); loadAppointments(data.tenant_id, weekStart) }
    })
  }, [user, supabase, weekStart, loadAppointments])

  function navigate(direction: -1 | 1) {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + direction * 7)
      return d
    })
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function getAppointmentsForDayHour(day: Date, hour: number) {
    return appointments.filter((a) => {
      const start = new Date(a.starts_at)
      return (
        start.getDate() === day.getDate() &&
        start.getMonth() === day.getMonth() &&
        start.getFullYear() === day.getFullYear() &&
        start.getHours() === hour
      )
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Calendar</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<TodayIcon />} onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <IconButton size="small" onClick={() => navigate(-1)}><PrevIcon /></IconButton>
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 180, textAlign: 'center' }}>
            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
          <IconButton size="small" onClick={() => navigate(1)}><NextIcon /></IconButton>
        </Box>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', minWidth: 700 }}>
            {/* Header */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1 }} />
            {days.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <Box
                  key={i}
                  sx={{
                    borderBottom: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    textAlign: 'center',
                    bgcolor: isToday ? 'primary.50' : 'transparent',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">{DAY_LABELS[i]}</Typography>
                  <Typography
                    variant="body2"
                    fontWeight={isToday ? 700 : 400}
                    sx={{ color: isToday ? 'primary.main' : 'text.primary' }}
                  >
                    {day.getDate()}
                  </Typography>
                </Box>
              )
            })}

            {/* Time rows */}
            {HOURS.map((hour) => (
              <>
                <Box
                  key={`h-${hour}`}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1, textAlign: 'right', pr: 1.5 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`}
                  </Typography>
                </Box>
                {days.map((day, di) => {
                  const slots = getAppointmentsForDayHour(day, hour)
                  return (
                    <Box
                      key={`${hour}-${di}`}
                      sx={{
                        borderBottom: '1px solid',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        p: 0.5,
                        minHeight: 56,
                        verticalAlign: 'top',
                      }}
                    >
                      {slots.map((appt) => (
                        <Box
                          key={appt.id}
                          sx={{
                            bgcolor: 'primary.50',
                            border: '1px solid',
                            borderColor: 'primary.200',
                            borderRadius: 1,
                            p: 0.5,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} display="block" noWrap>
                            {formatTime(new Date(appt.starts_at))} {appt.guestName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {appt.serviceName}
                          </Typography>
                          <Chip
                            label={appt.status}
                            size="small"
                            color={STATUS_COLORS[appt.status]}
                            sx={{ height: 16, fontSize: 10, mt: 0.25 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )
                })}
              </>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
