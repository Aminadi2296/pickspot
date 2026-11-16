-- ============================================================
-- Pickspot — Initial Database Schema
-- Run in Supabase SQL Editor (or via migration)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TENANTS (businesses)
-- ============================================================
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,           -- e.g. "acme-spa" → /acme-spa/book
  logo_url    text,
  email       text,
  phone       text,
  website     text,
  status      text not null default 'active' check (status in ('active','suspended','pending')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- LOCATIONS (branches per tenant)
-- ============================================================
create table locations (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  address     text,
  city        text,
  state       text,
  country     text default 'US',
  phone       text,
  timezone    text not null default 'America/New_York',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- SERVICE CATEGORIES
-- ============================================================
create table service_categories (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SERVICES
-- ============================================================
create table services (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  category_id     uuid references service_categories(id) on delete set null,
  name            text not null,
  description     text,
  duration_min    int not null default 60,   -- minutes
  price           numeric(10,2),             -- null = price on consultation
  currency        text not null default 'USD',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- USER ROLES (platform-level)
-- ============================================================
create table user_roles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin','owner','employee')),
  tenant_id   uuid references tenants(id) on delete cascade,  -- null for super_admin
  created_at  timestamptz not null default now(),
  unique(user_id, tenant_id)
);

-- ============================================================
-- STAFF (employees per location)
-- ============================================================
create table staff (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,  -- linked auth user (optional)
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  avatar_url    text,
  bio           text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Staff ↔ Location (many-to-many)
create table staff_locations (
  staff_id    uuid not null references staff(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  primary key (staff_id, location_id)
);

-- Staff ↔ Service (many-to-many, which services can they perform)
create table staff_services (
  staff_id    uuid not null references staff(id) on delete cascade,
  service_id  uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ============================================================
-- STAFF SCHEDULES (working hours per weekday)
-- ============================================================
create table staff_schedules (
  id            uuid primary key default uuid_generate_v4(),
  staff_id      uuid not null references staff(id) on delete cascade,
  location_id   uuid not null references locations(id) on delete cascade,
  day_of_week   int not null check (day_of_week between 0 and 6),  -- 0=Sun, 6=Sat
  start_time    time not null,   -- e.g. '09:00'
  end_time      time not null,   -- e.g. '17:00'
  break_start   time,
  break_end     time,
  is_working    boolean not null default true,
  unique(staff_id, location_id, day_of_week)
);

-- ============================================================
-- STAFF DAYS OFF (specific date exceptions)
-- ============================================================
create table staff_days_off (
  id          uuid primary key default uuid_generate_v4(),
  staff_id    uuid not null references staff(id) on delete cascade,
  date        date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  unique(staff_id, date)
);

-- ============================================================
-- APPOINTMENTS (guest bookings)
-- ============================================================
create table appointments (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  location_id       uuid not null references locations(id) on delete cascade,
  service_id        uuid not null references services(id),
  staff_id          uuid not null references staff(id),
  -- Guest info (no account required)
  guest_name        text not null,
  guest_email       text not null,
  guest_phone       text,
  notes             text,
  -- Timing
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  -- Status
  status            text not null default 'confirmed'
                      check (status in ('confirmed','cancelled','no_show','completed')),
  -- Notifications
  confirmation_sent boolean not null default false,
  reminder_sent     boolean not null default false,
  -- Phase 2: payments
  payment_status    text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  payment_intent_id text,  -- Stripe PaymentIntent (Phase 2)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on appointments(tenant_id, starts_at);
create index on appointments(staff_id, starts_at);
create index on appointments(location_id, starts_at);
create index on staff_schedules(staff_id, location_id);
create index on tenants(slug);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Tenants
alter table tenants enable row level security;
create policy "super_admin full access" on tenants
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'super_admin'));
create policy "owner sees own tenant" on tenants
  for select using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = tenants.id
  ));

-- Appointments: public insert (guest booking), restricted read
alter table appointments enable row level security;
create policy "public can insert appointment" on appointments
  for insert with check (true);
create policy "tenant members can read appointments" on appointments
  for select using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = appointments.tenant_id
  ));
create policy "tenant members can update appointments" on appointments
  for update using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = appointments.tenant_id
  ));

-- Staff schedules: tenant members only
alter table staff_schedules enable row level security;
create policy "tenant members manage schedules" on staff_schedules
  using (exists (
    select 1 from staff s
    join user_roles ur on ur.tenant_id = s.tenant_id
    where s.id = staff_schedules.staff_id and ur.user_id = auth.uid()
  ));
-- Allow public read for slot availability calculation
create policy "public read schedules" on staff_schedules
  for select using (true);

-- Staff days off: public read for slot calc
alter table staff_days_off enable row level security;
create policy "public read days off" on staff_days_off for select using (true);

-- Public read for booking wizard
alter table locations enable row level security;
create policy "public read active locations" on locations
  for select using (is_active = true);
create policy "tenant members manage locations" on locations
  using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = locations.tenant_id
  ));

alter table services enable row level security;
create policy "public read active services" on services
  for select using (is_active = true);
create policy "tenant members manage services" on services
  using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = services.tenant_id
  ));

alter table service_categories enable row level security;
create policy "public read categories" on service_categories for select using (true);
create policy "tenant members manage categories" on service_categories
  using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = service_categories.tenant_id
  ));

alter table staff enable row level security;
create policy "public read active staff" on staff for select using (is_active = true);
create policy "tenant members manage staff" on staff
  using (exists (
    select 1 from user_roles where user_id = auth.uid() and tenant_id = staff.tenant_id
  ));

alter table staff_locations enable row level security;
create policy "public read staff_locations" on staff_locations for select using (true);
create policy "tenant members manage staff_locations" on staff_locations
  using (exists (
    select 1 from staff s
    join user_roles ur on ur.tenant_id = s.tenant_id
    where s.id = staff_locations.staff_id and ur.user_id = auth.uid()
  ));

alter table staff_services enable row level security;
create policy "public read staff_services" on staff_services for select using (true);
create policy "tenant members manage staff_services" on staff_services
  using (exists (
    select 1 from staff s
    join user_roles ur on ur.tenant_id = s.tenant_id
    where s.id = staff_services.staff_id and ur.user_id = auth.uid()
  ));

alter table user_roles enable row level security;
create policy "super_admin manages roles" on user_roles
  using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'super_admin'));
create policy "users read own role" on user_roles
  for select using (user_id = auth.uid());

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at before update on tenants
  for each row execute function update_updated_at();
create trigger locations_updated_at before update on locations
  for each row execute function update_updated_at();
create trigger services_updated_at before update on services
  for each row execute function update_updated_at();
create trigger staff_updated_at before update on staff
  for each row execute function update_updated_at();
create trigger appointments_updated_at before update on appointments
  for each row execute function update_updated_at();
