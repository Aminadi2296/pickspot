'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { Location } from '@/types/database'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
]

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  timezone: 'America/New_York',
  phone: '',
}

export default function LocationsPage() {
  const { supabase, user } = useSupabase()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Location | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLocations = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })
    setLocations((data as Location[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.tenant_id) {
          setTenantId(data.tenant_id)
          loadLocations(data.tenant_id)
        }
      })
  }, [user, supabase, loadLocations])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(loc: Location) {
    setEditTarget(loc)
    setForm({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state ?? '',
      zip: loc.zip ?? '',
      country: loc.country,
      timezone: loc.timezone,
      phone: loc.phone ?? '',
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    setError(null)

    const payload = {
      tenant_id: tenantId,
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state || null,
      zip: form.zip || null,
      country: form.country,
      timezone: form.timezone,
      phone: form.phone || null,
      is_active: true,
    }

    if (editTarget) {
      const { error: err } = await supabase
        .from('locations')
        .update(payload)
        .eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('locations').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }

    await loadLocations(tenantId)
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location? This cannot be undone.')) return
    await supabase.from('locations').delete().eq('id', id)
    setLocations((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Locations</Typography>
          <Typography variant="body2" color="text.secondary">Manage your business locations</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Location
        </Button>
      </Box>

      <Grid container spacing={2}>
        {locations.map((loc) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={loc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{loc.name}</Typography>
                  <Chip
                    label={loc.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={loc.is_active ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {loc.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loc.city}{loc.state ? `, ${loc.state}` : ''} {loc.zip}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {loc.timezone}
                </Typography>
                {loc.phone && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {loc.phone}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <IconButton size="small" onClick={() => openEdit(loc)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(loc.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {locations.length === 0 && (
          <Grid size={12}>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
              No locations yet. Add your first location!
            </Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Location' : 'Add Location'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            </Grid>
            <Grid size={12}>
              <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} fullWidth required />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                select
                fullWidth
                required
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
