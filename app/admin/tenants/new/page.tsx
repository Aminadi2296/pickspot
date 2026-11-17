'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewTenantPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Tenant fields
  const [tenantName, setTenantName] = useState('')
  const [slug, setSlug] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')

  // Owner account fields
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  function handleNameChange(value: string) {
    setTenantName(value)
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Create the tenant row
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          slug,
          email: tenantEmail || null,
          phone: tenantPhone || null,
          status: 'active',
        })
        .select()
        .single()

      if (tenantError) throw new Error(`Tenant: ${tenantError.message}`)

      // 2. Create owner auth account via admin (requires service role in production)
      //    For the client-side MVP we use signUp and immediately link roles.
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: ownerEmail,
          password: ownerPassword,
        })

      if (signUpError) throw new Error(`Owner account: ${signUpError.message}`)
      if (!signUpData.user) throw new Error('No user returned from sign up')

      // 3. Assign owner role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: signUpData.user.id,
        tenant_id: tenant.id,
        role: 'owner',
      })

      if (roleError) throw new Error(`Role: ${roleError.message}`)

      setSuccess(true)
      setTimeout(() => router.push('/admin/tenants'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/admin/tenants"
          startIcon={<ArrowBackIcon />}
          variant="text"
          color="inherit"
          size="small"
          sx={{ mb: 1 }}
        >
          Back to Tenants
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create New Tenant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set up a new business account and owner login.
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 640 }}>
        <CardContent sx={{ p: 3 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Tenant created! Redirecting…
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Business Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Business Name"
                  value={tenantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="URL Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  fullWidth
                  required
                  helperText={`Booking page: pickspot.app/${slug}/book`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Business Email"
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Business Phone"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Owner Account
            </Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Owner Email"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Temporary Password"
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  fullWidth
                  required
                  helperText="Owner should change this on first login."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : null
                }
              >
                {loading ? 'Creating…' : 'Create Tenant'}
              </Button>
              <Button
                component={Link}
                href="/admin/tenants"
                variant="outlined"
                color="inherit"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
