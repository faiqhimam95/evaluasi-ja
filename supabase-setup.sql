-- ============================================================
-- Setup database Evaluasi Mingguan PP Jalaluddin Ar-Rumi
-- Jalankan sekali di Supabase Dashboard > SQL Editor > Run
-- ============================================================

create table if not exists public.divisions (
  id text primary key,
  coordinator text not null default '',
  programs jsonb not null default '[]'::jsonb
);

create table if not exists public.entries (
  week_key text not null,
  div_id text not null,
  day_idx int not null,
  prog_id text not null,
  a text not null default '',
  b text not null default '',
  ket text not null default '',
  kendala text not null default '',
  solusi text not null default '',
  absen text not null default '',
  updated_at timestamptz not null default now(),
  primary key (week_key, div_id, day_idx, prog_id)
);

create table if not exists public.week_notes (
  week_key text primary key,
  notes text not null default ''
);

create table if not exists public.pengasuh_notes (
  week_key text not null,
  div_id text not null,
  prog_id text not null,
  note text not null default '',
  primary key (week_key, div_id, prog_id)
);

create table if not exists public.accounts (
  id text primary key,
  label text not null,
  role text not null,
  div_id text,
  plain text,
  hash text
);

-- Aktifkan Row Level Security dengan kebijakan terbuka untuk anon.
-- (Aplikasi memakai sistem akun internal; kunci anon memang bersifat publik.)
alter table public.divisions enable row level security;
alter table public.entries enable row level security;
alter table public.week_notes enable row level security;
alter table public.pengasuh_notes enable row level security;
alter table public.accounts enable row level security;

drop policy if exists "anon all divisions" on public.divisions;
create policy "anon all divisions" on public.divisions for all to anon using (true) with check (true);

drop policy if exists "anon all entries" on public.entries;
create policy "anon all entries" on public.entries for all to anon using (true) with check (true);

drop policy if exists "anon all week_notes" on public.week_notes;
create policy "anon all week_notes" on public.week_notes for all to anon using (true) with check (true);

drop policy if exists "anon all pengasuh_notes" on public.pengasuh_notes;
create policy "anon all pengasuh_notes" on public.pengasuh_notes for all to anon using (true) with check (true);

drop policy if exists "anon all accounts" on public.accounts;
create policy "anon all accounts" on public.accounts for all to anon using (true) with check (true);
