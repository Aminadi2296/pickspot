import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingWizard from '@/components/booking/BookingWizard'
import type { Tenant } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !tenant) {
    notFound()
  }

  return <BookingWizard tenant={tenant as Tenant} />
}
