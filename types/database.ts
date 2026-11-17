export type UserRoleType = 'super_admin' | 'owner' | 'employee'
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'no_show' | 'completed'

export type Tenant = {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  status: 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export type Location = {
  id: string
  tenant_id: string
  name: string
  address: string
  city: string
  state: string | null
  zip: string | null
  country: string
  timezone: string
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ServiceCategory = {
  id: string
  tenant_id: string
  name: string
  sort_order: number
  created_at: string
}

export type Service = {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_min: number
  price: number | null
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserRole = {
  id: string
  user_id: string
  tenant_id: string | null
  role: UserRoleType
  created_at: string
}

export type Staff = {
  id: string
  tenant_id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StaffLocation = {
  id: string
  staff_id: string
  location_id: string
  created_at: string
}

export type StaffService = {
  id: string
  staff_id: string
  service_id: string
  created_at: string
}

export type StaffSchedule = {
  id: string
  staff_id: string
  location_id: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  is_working: boolean
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
  break_start: string | null
  break_end: string | null
  created_at: string
  updated_at: string
}

export type StaffDayOff = {
  id: string
  staff_id: string
  date: string // "YYYY-MM-DD"
  reason: string | null
  created_at: string
}

export type Appointment = {
  id: string
  tenant_id: string
  location_id: string
  service_id: string
  staff_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  notes: string | null
  status: AppointmentStatus
  starts_at: string // ISO timestamp
  ends_at: string   // ISO timestamp
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      locations: {
        Row: Location
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      service_categories: {
        Row: ServiceCategory
        Insert: Omit<ServiceCategory, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ServiceCategory, 'id' | 'created_at'>>
        Relationships: []
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      user_roles: {
        Row: UserRole
        Insert: Omit<UserRole, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<UserRole, 'id' | 'created_at'>>
        Relationships: []
      }
      staff: {
        Row: Staff
        Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'avatar_url'> & { id?: string; user_id?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      staff_locations: {
        Row: StaffLocation
        Insert: Omit<StaffLocation, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<StaffLocation, 'id' | 'created_at'>>
        Relationships: []
      }
      staff_services: {
        Row: StaffService
        Insert: Omit<StaffService, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<StaffService, 'id' | 'created_at'>>
        Relationships: []
      }
      staff_schedules: {
        Row: StaffSchedule
        Insert: Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      staff_days_off: {
        Row: StaffDayOff
        Insert: Omit<StaffDayOff, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<StaffDayOff, 'id' | 'created_at'>>
        Relationships: []
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role_type: UserRoleType
      appointment_status: AppointmentStatus
    }
  }
}
