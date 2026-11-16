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
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { formatDuration, formatPrice } from '@/lib/utils'
import type { Service, ServiceCategory } from '@/types/database'

const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  duration_minutes: 60,
  price: '',
  currency: 'USD',
}

export default function ServicesPage() {
  const { supabase, user } = useSupabase()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (tid: string) => {
    const [{ data: sData }, { data: cData }] = await Promise.all([
      supabase.from('services').select('*').eq('tenant_id', tid).order('name'),
      supabase.from('service_categories').select('*').eq('tenant_id', tid).order('display_order'),
    ])
    setServices((sData as Service[]) ?? [])
    setCategories((cData as ServiceCategory[]) ?? [])
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

  function openEdit(service: Service) {
    setEditTarget(service)
    setForm({
      name: service.name,
      description: service.description ?? '',
      category_id: service.category_id ?? '',
      duration_minutes: service.duration_minutes,
      price: service.price !== null ? String(service.price / 100) : '',
      currency: service.currency,
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    setError(null)

    const priceValue = form.price === '' ? null : Math.round(parseFloat(form.price) * 100)

    const payload = {
      tenant_id: tenantId,
      name: form.name,
      description: form.description || null,
      category_id: form.category_id || null,
      duration_minutes: Number(form.duration_minutes),
      price: priceValue,
      currency: form.currency,
      is_active: true,
    }

    if (editTarget) {
      const { error: err } = await supabase.from('services').update(payload).eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('services').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }

    await loadData(tenantId)
    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Services</Typography>
          <Typography variant="body2" color="text.secondary">Manage your service offerings</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Service</Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => {
              const cat = categories.find((c) => c.id === service.category_id)
              return (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{service.name}</Typography>
                    {service.description && (
                      <Typography variant="caption" color="text.secondary">{service.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{cat?.name ?? '—'}</TableCell>
                  <TableCell>{formatDuration(service.duration_minutes)}</TableCell>
                  <TableCell>{formatPrice(service.price, service.currency)}</TableCell>
                  <TableCell>
                    <Chip label={service.is_active ? 'Active' : 'Inactive'} size="small" color={service.is_active ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(service)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(service.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No services yet. Add your first service!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Service Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} select fullWidth>
              <MenuItem value="">None</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} fullWidth required inputProps={{ min: 5, step: 5 }} />
            <TextField label="Price (leave blank for 'consultation')" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth type="number" inputProps={{ min: 0, step: 0.01 }} helperText="Enter amount in dollars, e.g. 75.00" />
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
