import { createClient } from '@/lib/supabase/server'
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import Link from 'next/link'
import type { Tenant } from '@/types/database'

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <Box>
        <Typography color="error">Failed to load tenants: {error.message}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Tenants
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all business accounts on Pickspot
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/tenants/new"
        >
          Create Tenant
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tenants as Tenant[]).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No tenants yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              (tenants as Tenant[]).map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{tenant.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {tenant.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{tenant.email ?? '—'}</TableCell>
                  <TableCell>{tenant.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.status}
                      size="small"
                      color={tenant.status === 'active' ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
