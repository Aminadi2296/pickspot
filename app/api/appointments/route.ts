import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation, sendBusinessNotification } from '@/lib/resend'
import type { Appointment } from '@/types/database'

interface BookingBody {
  tenantId: string
  locationId: string
  serviceId: string
  staffId: string | null
  guestName: string
  guestEmail: string
  guestPhone: string | null
  notes: string | null
  startsAt: string // ISO string
}

export async function POST(request: NextRequest) {
  let body: BookingBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tenantId, locationId, serviceId, staffId, guestName, guestEmail, guestPhone, notes, startsAt } = body

  if (!tenantId || !locationId || !serviceId || !guestName || !guestEmail || !startsAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Load service to calculate ends_at
  const { data: service, error: svcError } = await supabase
    .from('services')
    .select('duration_min, name')
    .eq('id', serviceId)
    .single()

  if (svcError || !service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const startsAtDate = new Date(startsAt)
  const endsAtDate = new Date(startsAtDate.getTime() + service.duration_min * 60 * 1000)

  // 2. Determine which staff member to assign
  let assignedStaffId = staffId

  if (!assignedStaffId) {
    // Pick any available staff for this service + location
    const { data: ssData } = await supabase
      .from('staff_services')
      .select('staff_id')
      .eq('service_id', serviceId)

    const { data: slData } = await supabase
      .from('staff_locations')
      .select('staff_id')
      .eq('location_id', locationId)

    const ssIds = new Set((ssData ?? []).map((s) => s.staff_id))
    const slIds = new Set((slData ?? []).map((s) => s.staff_id))
    const eligible = [...ssIds].filter((id) => slIds.has(id))

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'No available staff for this service and location' }, { status: 409 })
    }

    // Find first eligible staff with no conflicting appointment
    for (const sid of eligible) {
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', sid)
        .eq('status', 'confirmed')
        .lt('starts_at', endsAtDate.toISOString())
        .gt('ends_at', startsAtDate.toISOString())
        .maybeSingle()

      if (!conflict) {
        assignedStaffId = sid
        break
      }
    }

    if (!assignedStaffId) {
      return NextResponse.json({ error: 'No available time slot for the selected service' }, { status: 409 })
    }
  } else {
    // 3. Validate the requested slot is still free
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('staff_id', assignedStaffId)
      .eq('status', 'confirmed')
      .lt('starts_at', endsAtDate.toISOString())
      .gt('ends_at', startsAtDate.toISOString())
      .maybeSingle()

    if (conflict) {
      return NextResponse.json({ error: 'That time slot is no longer available. Please choose another.' }, { status: 409 })
    }
  }

  // 4. Create the appointment (generate ID client-side so anon INSERT doesn't require SELECT RLS)
  const appointmentId = crypto.randomUUID()
  const { error: insertError } = await supabase
    .from('appointments')
    .insert({
      id: appointmentId,
      tenant_id: tenantId,
      location_id: locationId,
      service_id: serviceId,
      staff_id: assignedStaffId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone ?? null,
      notes: notes ?? null,
      status: 'confirmed',
      starts_at: startsAtDate.toISOString(),
      ends_at: endsAtDate.toISOString(),
    })

  if (insertError) {
    console.error('[Appointments] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }

  // 5. Load related data for notifications
  const [{ data: location }, { data: staff }, { data: tenant }] = await Promise.all([
    supabase.from('locations').select('name, address, city, timezone, phone').eq('id', locationId).single(),
    supabase.from('staff').select('first_name, last_name').eq('id', assignedStaffId).single(),
    supabase.from('tenants').select('name, email').eq('id', tenantId).single(),
  ])

  // 6. Send emails (non-blocking for booking success, but awaited before response ends)
  if (location && staff && tenant) {
    const locationAddress = `${location.address}, ${location.city}`
    const staffName = `${staff.first_name} ${staff.last_name}`

    await Promise.allSettled([
      sendBookingConfirmation({
        to: guestEmail,
        guestName,
        businessName: tenant.name,
        serviceName: service.name,
        staffName,
        locationName: location.name,
        locationAddress,
        startsAt: startsAtDate,
        timezone: location.timezone,
      }),
      tenant.email
        ? sendBusinessNotification({
            to: tenant.email,
            businessName: tenant.name,
            guestName,
            guestEmail,
            guestPhone: guestPhone ?? 'Not provided',
            notes,
            serviceName: service.name,
            staffName,
            locationName: location.name,
            locationAddress,
            startsAt: startsAtDate,
            timezone: location.timezone,
          })
        : Promise.resolve(),
    ])
  }

  return NextResponse.json({ appointmentId }, { status: 201 })
}
