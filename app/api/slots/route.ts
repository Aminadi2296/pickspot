import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTimeSlots } from '@/lib/utils'
import type { StaffSchedule, Appointment } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const staffId = searchParams.get('staffId')
  const locationId = searchParams.get('locationId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date') // 'YYYY-MM-DD'

  if (!locationId || !serviceId || !date) {
    return NextResponse.json(
      { error: 'locationId, serviceId, and date are required' },
      { status: 400 }
    )
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get the service duration
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration_min')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const dayOfWeek = new Date(date + 'T12:00:00').getDay() // avoid timezone shift

  // If a specific staff member is requested
  if (staffId) {
    return NextResponse.json(
      await getSlotsForStaff(supabase, staffId, locationId, serviceId, date, dayOfWeek, service.duration_min)
    )
  }

  // "Any available" — get all eligible staff and merge slots
  const { data: staffServices } = await supabase
    .from('staff_services')
    .select('staff_id')
    .eq('service_id', serviceId)

  const { data: staffLocations } = await supabase
    .from('staff_locations')
    .select('staff_id')
    .eq('location_id', locationId)

  const ssIds = new Set((staffServices ?? []).map((s) => s.staff_id))
  const slIds = new Set((staffLocations ?? []).map((s) => s.staff_id))
  const eligibleIds = [...ssIds].filter((id) => slIds.has(id))

  if (eligibleIds.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  const allSlotSets = await Promise.all(
    eligibleIds.map((sid) =>
      getSlotsForStaff(supabase, sid, locationId, serviceId, date, dayOfWeek, service.duration_min).then(
        (r) => new Set(r.slots)
      )
    )
  )

  // Union of all available slots across all eligible staff
  const unionSlots = [...new Set(allSlotSets.flatMap((s) => [...s]))].sort()
  return NextResponse.json({ slots: unionSlots })
}

async function getSlotsForStaff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  staffId: string,
  locationId: string,
  _serviceId: string,
  date: string,
  dayOfWeek: number,
  durationMinutes: number
): Promise<{ slots: string[] }> {
  // 1. Check for days off
  const { data: dayOff } = await supabase
    .from('staff_days_off')
    .select('id')
    .eq('staff_id', staffId)
    .eq('date', date)
    .maybeSingle()

  if (dayOff) return { slots: [] }

  // 2. Get staff schedule for the day
  const { data: schedule } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', staffId)
    .eq('location_id', locationId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle() as { data: StaffSchedule | null }

  if (!schedule || !schedule.is_working) return { slots: [] }

  // 3. Generate base slots
  const baseSlots = generateTimeSlots(
    schedule.start_time,
    schedule.end_time,
    durationMinutes,
    schedule.break_start ?? undefined,
    schedule.break_end ?? undefined
  )

  // 4. Get existing confirmed appointments for that staff on that date
  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`

  const { data: existingAppts } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('staff_id', staffId)
    .eq('status', 'confirmed')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd) as { data: Pick<Appointment, 'starts_at' | 'ends_at'>[] | null }

  if (!existingAppts || existingAppts.length === 0) {
    return { slots: baseSlots }
  }

  // 5. Remove booked slots
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const bookedRanges = existingAppts.map((a) => {
    const start = new Date(a.starts_at)
    const end = new Date(a.ends_at)
    return {
      start: start.getHours() * 60 + start.getMinutes(),
      end: end.getHours() * 60 + end.getMinutes(),
    }
  })

  const availableSlots = baseSlots.filter((slot) => {
    const slotStart = toMinutes(slot)
    const slotEnd = slotStart + durationMinutes
    return !bookedRanges.some((r) => slotStart < r.end && slotEnd > r.start)
  })

  return { slots: availableSlots }
}
