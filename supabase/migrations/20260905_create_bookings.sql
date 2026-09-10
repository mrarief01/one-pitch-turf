-- Run this in the Supabase SQL editor (or `supabase db push`) before deploying.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique default ('TRF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  court_id text not null check (court_id in ('C1', 'C2', 'F')),
  booking_date date not null,
  slot_ids text[] not null check (cardinality(slot_ids) > 0),
  start_time text not null,
  end_time text not null,
  duration_hours integer not null check (duration_hours > 0),
  price_total integer not null check (price_total >= 0),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  team_name text,
  sport_type text,
  status text not null default 'HELD' check (status in ('HELD', 'CONFIRMED', 'CANCELLED')),
  payment_method text not null default 'UPI',
  payment_status text not null default 'PENDING' check (payment_status in ('PAID', 'PENDING')),
  payment_id text unique,
  order_id text unique,
  held_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bookings_active_lookup_idx
  on public.bookings (booking_date, court_id, status);
create index if not exists bookings_slot_ids_idx on public.bookings using gin (slot_ids);

alter table public.bookings enable row level security;
-- The browser never reads this table directly. All access is through the RPCs below.

create or replace function public.hold_booking(
  p_court_id text, p_booking_date date, p_slot_ids text[],
  p_customer_name text, p_customer_phone text, p_customer_email text,
  p_start_time text, p_end_time text, p_duration_hours integer, p_price_total integer
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare result public.bookings;
begin
  if p_court_id not in ('C1', 'C2', 'F') or cardinality(p_slot_ids) is null or cardinality(p_slot_ids) = 0 then
    raise exception 'Invalid court or slots';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_booking_date::text));
  delete from public.bookings where status = 'HELD' and held_until <= now();
  if exists (
    select 1 from public.bookings b
    where b.booking_date = p_booking_date
      and b.status in ('HELD', 'CONFIRMED')
      and b.slot_ids && p_slot_ids
      and (b.court_id = 'F' or p_court_id = 'F' or b.court_id = p_court_id)
  ) then raise exception 'Selected slots are no longer available'; end if;
  insert into public.bookings (
    court_id, booking_date, slot_ids, start_time, end_time, duration_hours, price_total,
    customer_name, customer_phone, customer_email, held_until
  ) values (
    p_court_id, p_booking_date, p_slot_ids, p_start_time, p_end_time, p_duration_hours, p_price_total,
    p_customer_name, p_customer_phone, nullif(p_customer_email, ''), now() + interval '5 minutes'
  ) returning * into result;
  return result;
end; $$;

create or replace function public.active_booking_slots(p_booking_date date)
returns table (court_id text, slot_ids text[], status text, held_until timestamptz, team_name text)
language sql security definer set search_path = public as $$
  select b.court_id, b.slot_ids, b.status, b.held_until, b.team_name
  from public.bookings b
  where b.booking_date = p_booking_date and b.status in ('HELD', 'CONFIRMED')
    and (b.status <> 'HELD' or b.held_until > now());
$$;

create or replace function public.attach_booking_order(p_booking_id uuid, p_order_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.bookings set order_id = p_order_id
  where id = p_booking_id and status = 'HELD' and held_until > now();
  return found;
end; $$;

create or replace function public.confirm_booking(
  p_booking_id uuid, p_order_id text, p_payment_id text,
  p_customer_name text, p_customer_phone text, p_customer_email text,
  p_team_name text, p_sport_type text, p_payment_status text default 'PAID'
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare result public.bookings;
begin
  update public.bookings set
    booking_ref = 'TRF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    customer_name = p_customer_name, customer_phone = p_customer_phone,
    customer_email = nullif(p_customer_email, ''), team_name = nullif(p_team_name, ''),
    sport_type = nullif(p_sport_type, ''), payment_id = nullif(p_payment_id, ''),
    payment_status = p_payment_status, status = 'CONFIRMED', held_until = null
  where id = p_booking_id and status = 'HELD' and held_until > now()
    and (p_order_id is null or order_id = p_order_id)
  returning * into result;
  if not found then raise exception 'This checkout hold is no longer valid'; end if;
  return result;
end; $$;

grant execute on function public.hold_booking(text, date, text[], text, text, text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.attach_booking_order(uuid, text) to anon, authenticated;
grant execute on function public.confirm_booking(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.active_booking_slots(date) to anon, authenticated;
