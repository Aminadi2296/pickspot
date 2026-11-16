'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Schedule as ScheduleIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { Staff, Location, StaffLocation } from '@/types/database'

type StaffWithLocations = Staff & { locations: string[] }

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '', bio: '', location_ids: [] as string[] }

export default function StaffPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffWithLocations[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Staff | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (tid: string) => {
    const [{ data: staffData }, { data: locData }, { data: slData }] = await Promise.all([
      supabase.from('staff').select('*').eq('tenant_id', tid).order('first_name'),
      supabase.from('locations').select('*').eq('tenant_id', tid).eq('is_active', true),
      supabase.from('staff_locations').select('*'),
    ])

    const staffWithLocs = ((staffData as Staff[]) ?? []).map((s) => ({
      ...s,
      locations: ((slData as StaffLocation[]) ?? [])
        .filter((sl) => sl.staff_id === s.id)
        .map((sl) => sl.location_id),
    }))

    setStaff(staffWithLocs)
    setLocations((locData as Location[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!user) return
    supabase.from('user_roles').select('tenant_id').eq('user_id', user.id).single().then(({ data }) => {
      if (data?.tenant_id) { setTenantId(data.tenant_id); loadData(data.tenant_id) }
    })
  }, [user, supabase, loadData])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(s: StaffWithLocations) {
    setEditTarget(s)
    setForm({ first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone ?? '', bio: s.bio ?? '', location_ids: s.locations })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    setError(null)

    const payload = {
      tenant_id: tenantId,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      bio: form.bio || null,
      is_active: true,
    }

    let staffId: string
    if (editTarget) {
      const { error: err } = await supabase.from('staff').update(payload).eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
      staffId = editTarget.id
      await supabase.from('staff_locations').delete().eq('staff_id', staffId)
    } else {
      const { data, error: err } = await supabase.from('staff').insert(payload).select().single()
      if (err || !data) { setError(err?.message ?? 'Insert failed'); setSaving(false); return }
      staffId = data.id
    }

    if (form.location_ids.length > 0) {
      await supabase.from('staff_locations').insert(form.location_ids.map((lid) => ({ staff_id: staffId, location_id: lid })))
    }

    await loadData(tenantId)
    setSaving(false)
    setDialogOpen(false)
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Staff</Typography>
          <Typography variant="body2" color="text.secondary">Manage your team members</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Staff</Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Locations</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 14 }}>
                      {s.first_name.charAt(0)}
                    </Avatar>
                    <Typography fontWeight={500}>{s.first_name} {s.last_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {s.locations.map((lid) => {
                      const loc = locations.find((l) => l.id === lid)
                      return loc ? <Chip key={lid} label={loc.name} size="small" /> : null
                    })}
                    {s.locations.length === 0 && <Typography variant="caption" color="text.secondary">None assigned</Typography>}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={s.is_active ? 'Active' : 'Inactive'} size="small" color={s.is_active ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="primary" onClick={() => router.push(`/dashboard/business/staff/${s.id}/schedule`)}>
                    <ScheduleIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No staff yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} fullWidth required />
              <TextField label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} fullWidth required />
            </Box>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth required />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            <TextField label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} fullWidth multiline rows={2} />
            <TextField
              label="Assigned Locations"
              value={form.location_ids}
              onChange={(e) => setForm({ ...form, location_ids: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as unknown as string[] })}
              select
              SelectProps={{ multiple: true }}
              fullWidth
            >
              {locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
