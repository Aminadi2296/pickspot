import { createClient } from '@/lib/supabase/server'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import { formatTime } from '@/lib/utils'
import type { Appointment } from '@/types/database'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Find staff record linked to this user
  const { data: staffRow } = await supabase
    .from('staff')
    .select('id, first_name, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!staffRow) {
    return (
      <Box>
        <Typography>No staff profile found for your account.</Typography>
      </Box>
    )
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('staff_id', staffRow.id)
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true })

  const todayAppts = ((appointments as Appointment[]) ?? []).filter((a) =>
    a.starts_at.startsWith(todayStr)
  )
  const upcomingAppts = ((appointments as Appointment[]) ?? []).filter(
    (a) => !a.starts_at.startsWith(todayStr)
  )

  async function renderApptTable(appts: Appointment[], title: string) {
    if (appts.length === 0) return null

    const serviceIds = [...new Set(appts.map((a) => a.service_id))]
    const { data: services } = await supabase.from('services').select('id, name').in('id', serviceIds)

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>{title}</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appts.map((appt) => {
                const svc = (services ?? []).find((s) => s.id === appt.service_id)
                return (
                  <TableRow key={appt.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(appt.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(new Date(appt.starts_at))}
                      </Typography>
                    </TableCell>
                    <TableCell>{appt.guest_name}</TableCell>
                    <TableCell>{svc?.name ?? '—'}</TableCell>
                    <TableCell>{appt.guest_phone ?? '—'}</TableCell>
                    <TableCell>
                      <Chip label={appt.status} size="small" color="primary" variant="outlined" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Welcome, {staffRow.first_name}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''} today
        </Typography>
      </Box>

      {await renderApptTable(todayAppts, "Today's Appointments")}
      {await renderApptTable(upcomingAppts, 'Upcoming This Week')}

      {todayAppts.length === 0 && upcomingAppts.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          No upcoming appointments. Enjoy your day! 🎉
        </Typography>
      )}
    </Box>
  )
}
