create extension if not exists pgcrypto;
create table leads(
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null unique,
  created_at timestamptz not null default now(),
  marketing_consent boolean not null default false,
  consent_at timestamptz, unsub_token text not null);
create table audits(
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  url text, answers jsonb not null, score int not null,
  categories jsonb not null, problems jsonb not null, scan jsonb,
  created_at timestamptz not null default now());
-- RLS activado y sin políticas: solo accede la service key desde las funciones.
alter table leads enable row level security;
alter table audits enable row level security;
