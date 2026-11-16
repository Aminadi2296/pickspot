'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  CircularProgress,
} from '@mui/material'
import { LocationOn as LocationIcon } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import type { Location } from '@/types/database'

interface LocationStepProps {
  tenantId: string
  selected: Location | null
  onSelect: (location: Location) => void
}

export default function LocationStep({ tenantId, selected, onSelect }: LocationStepProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setLocations((data as Location[]) ?? [])
        setLoading(false)
      })
  }, [tenantId])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
        Choose a Location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the location you&apos;d like to visit.
      </Typography>

      <Grid container spacing={2}>
        {locations.map((loc) => (
          <Grid size={{ xs: 12, sm: 6 }} key={loc.id}>
            <Card
              variant={selected?.id === loc.id ? 'elevation' : 'outlined'}
              sx={{
                borderColor: selected?.id === loc.id ? 'primary.main' : 'divider',
                borderWidth: selected?.id === loc.id ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => onSelect(loc)}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    <LocationIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{loc.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loc.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loc.city}{loc.state ? `, ${loc.state}` : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}

        {locations.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No locations available.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
