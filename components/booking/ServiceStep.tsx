'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, formatPrice } from '@/lib/utils'
import type { Service, ServiceCategory } from '@/types/database'

interface ServiceStepProps {
  tenantId: string
  locationId: string
  selected: Service | null
  onSelect: (service: Service) => void
  onBack: () => void
}

type CategoryWithServices = ServiceCategory & { services: Service[] }

export default function ServiceStep({
  tenantId,
  selected,
  onSelect,
  onBack,
}: ServiceStepProps) {
  const [grouped, setGrouped] = useState<CategoryWithServices[]>([])
  const [uncategorized, setUncategorized] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('services').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('name'),
      supabase.from('service_categories').select('*').eq('tenant_id', tenantId).order('sort_order'),
    ]).then(([{ data: services }, { data: cats }]) => {
      const svcList = (services as Service[]) ?? []
      const catList = (cats as ServiceCategory[]) ?? []

      const catMap: Record<string, CategoryWithServices> = {}
      catList.forEach((c) => { catMap[c.id] = { ...c, services: [] } })

      const uncat: Service[] = []
      svcList.forEach((s) => {
        if (s.category_id && catMap[s.category_id]) {
          catMap[s.category_id].services.push(s)
        } else {
          uncat.push(s)
        }
      })

      setGrouped(catList.map((c) => catMap[c.id]).filter((c) => c.services.length > 0))
      setUncategorized(uncat)
      setLoading(false)
    })
  }, [tenantId])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>

  function ServiceCard({ service }: { service: Service }) {
    return (
      <Card
        variant={selected?.id === service.id ? 'elevation' : 'outlined'}
        sx={{
          mb: 1.5,
          borderColor: selected?.id === service.id ? 'primary.main' : 'divider',
          borderWidth: selected?.id === service.id ? 2 : 1,
        }}
      >
        <CardActionArea onClick={() => onSelect(service)}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight={600}>{service.name}</Typography>
              {service.description && (
                <Typography variant="body2" color="text.secondary">{service.description}</Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDuration(service.duration_min)}
              </Typography>
            </Box>
            <Typography fontWeight={700} color="primary.main" sx={{ ml: 2, flexShrink: 0 }}>
              {formatPrice(service.price, service.currency)}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    )
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Choose a Service</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>What would you like to book?</Typography>

      {grouped.map((cat) => (
        <Box key={cat.id} sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>{cat.name}</Typography>
          <Divider sx={{ mb: 1.5 }} />
          {cat.services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </Box>
      ))}

      {uncategorized.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {grouped.length > 0 && <Typography variant="overline" color="text.secondary" fontWeight={700}>Other</Typography>}
          {grouped.length > 0 && <Divider sx={{ mb: 1.5 }} />}
          {uncategorized.map((s) => <ServiceCard key={s.id} service={s} />)}
        </Box>
      )}

      <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="text" color="inherit">
        Back
      </Button>
    </Box>
  )
}
