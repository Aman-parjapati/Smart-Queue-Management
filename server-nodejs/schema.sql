-- ============================================================
-- Smart Queue & Appointment System — Supabase Schema v2
-- Run this in your Supabase SQL editor (fresh project)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── CUSTOMERS ────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text unique not null,
  phone         text,
  password_hash text not null,
  role          text default 'customer',   -- always 'customer'
  created_at    timestamptz default now()
);

-- ── BUSINESS ADMINS (separate auth table) ────────────────────
create table if not exists business_admins (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text unique not null,
  phone         text,
  password_hash text not null,
  created_at    timestamptz default now()
);

-- ── BUSINESSES ───────────────────────────────────────────────
create table if not exists businesses (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid references business_admins(id) on delete cascade,
  name              text not null,
  category          text not null,
  address           text,
  branch            text,
  avg_service_time  integer default 10,
  created_at        timestamptz default now()
);

-- ── STAFF (created by admin, not self-registered) ────────────
create table if not exists staff (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references businesses(id) on delete cascade,
  admin_id      uuid references business_admins(id) on delete cascade,
  name          text not null,
  email         text unique not null,
  phone         text,
  password_hash text not null,
  created_at    timestamptz default now()
);

-- ── SLOTS ────────────────────────────────────────────────────
create table if not exists slots (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references businesses(id) on delete cascade,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  max_capacity  integer not null default 20,
  booked_count  integer not null default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
create table if not exists bookings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id) on delete cascade,
  slot_id       uuid references slots(id) on delete cascade,
  token_number  integer not null,
  qr_code       text,
  status        text not null check (status in ('pending','arrived','serving','done','skipped')) default 'pending',
  created_at    timestamptz default now()
);

-- ── QUEUE EVENTS (analytics) ─────────────────────────────────
create table if not exists queue_events (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references bookings(id) on delete set null,
  event_type  text not null,
  timestamp   timestamptz default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_bookings_slot    on bookings(slot_id);
create index if not exists idx_bookings_user    on bookings(user_id);
create index if not exists idx_bookings_status  on bookings(status);
create index if not exists idx_slots_business   on slots(business_id);
create index if not exists idx_staff_business   on staff(business_id);
create index if not exists idx_queue_events_bid on queue_events(booking_id);

-- ── SEED: default admin account ──────────────────────────────
-- Password: admin123  (change immediately in production!)
-- Hash generated with bcrypt rounds=10
insert into business_admins (name, email, phone, password_hash)
values (
  'Admin',
  'admin@smartqueue.com',
  '9999999999',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoOa8n1IpTh8YLhL7Ow0xOW6w1A5r8GGSG'
)
on conflict (email) do nothing;
