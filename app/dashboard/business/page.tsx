import { createClient } from '@/lib/supabase/server'
import { Box, Grid, Typography, Card, CardContent } from '@mui/material'
import {
  CalendarToday,
  DateRange,
  People,
  LocationOn,
} from '@mui/icons-material'

async function getStats(tenantId: string) {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const [
    { count: todayCount },
    { count: weekCount },
    { count: staffCount },
    { count: locationCount },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'confirmed')
      .gte('starts_at', `${todayStr}T00:00:00`)
      .lt('starts_at', `${todayStr}T23:59:59`),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'confirmed')
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', weekEnd.toISOString()),
    supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
  ])

  return {
    today: todayCount ?? 0,
    week: weekCount ?? 0,
    staff: staffCount ?? 0,
    locations: locationCount ?? 0,
  }
}

type StatCardProps = {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default async function BusinessOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('tenant_id')
    .eq('user_id', user!.id)
    .single()

  const tenantId = roleRow?.tenant_id ?? ''
  const stats = await getStats(tenantId)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {tenant?.name ?? 'Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here&apos;s what&apos;s happening at your business today.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Appointments Today"
            value={stats.today}
            icon={<CalendarToday />}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Upcoming This Week"
            value={stats.week}
            icon={<DateRange />}
            color="#ec4899"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Staff"
            value={stats.staff}
            icon={<People />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Locations"
            value={stats.locations}
            icon={<LocationOn />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>
    </Box>
  )
}
