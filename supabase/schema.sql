-- UYARIY · esquema inicial. Pégalo en Supabase → SQL Editor → Run.

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('student','staff')),  -- un solo rol por cuenta
  full_name text,
  school_id uuid references schools(id),
  grade text,
  section text
);

create table consents (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now()
);

create table checkins (
  id bigserial primary key,
  student_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  result text check (result in ('victima','agresor','testigo','sin_senal')),
  created_at timestamptz not null default now()
);

create table reports (
  id bigserial primary key,
  case_number bigint generated always as identity,
  reporter_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('victima','testigo')),
  what text, aggressor_name text, place text, happened_at text, times text,
  evidence_path text,
  priority text not null default 'media' check (priority in ('media','alta')),
  status text not null default 'pendiente' check (status in ('pendiente','revisado','cerrado')),
  created_at timestamptz not null default now()
);

create table followups (
  id bigserial primary key,
  report_id bigint not null references reports(id) on delete cascade,
  feeling text not null check (feeling in ('mejor','igual','peor')),
  created_at timestamptz not null default now()
);

create table messages (
  id bigserial primary key,
  student_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ¿El usuario actual es tutor/psicólogo?
create function is_staff() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'staff');
$$;

-- Seguridad por fila (RLS): nadie ve nada por defecto.
alter table schools enable row level security;
alter table profiles enable row level security;
alter table consents enable row level security;
alter table checkins enable row level security;
alter table reports enable row level security;
alter table followups enable row level security;
alter table messages enable row level security;

create policy "ver mi perfil o staff ve todos" on profiles for select using (id = auth.uid() or is_staff());
create policy "ver colegios" on schools for select using (auth.uid() is not null);

create policy "mis consentimientos" on consents for select using (user_id = auth.uid());
create policy "aceptar consentimiento" on consents for insert with check (user_id = auth.uid());

create policy "estudiante crea check-in" on checkins for insert with check (student_id = auth.uid());
create policy "ver check-ins propios o staff" on checkins for select using (student_id = auth.uid() or is_staff());

create policy "estudiante crea reporte" on reports for insert with check (reporter_id = auth.uid());
create policy "ver reportes propios o staff" on reports for select using (reporter_id = auth.uid() or is_staff());
create policy "staff actualiza reportes" on reports for update using (is_staff());

create policy "seguimiento propio" on followups for insert
  with check (exists (select 1 from reports r where r.id = report_id and r.reporter_id = auth.uid()));
create policy "ver seguimiento" on followups for select
  using (is_staff() or exists (select 1 from reports r where r.id = report_id and r.reporter_id = auth.uid()));

create policy "ver mensajes propios o staff" on messages for select using (student_id = auth.uid() or is_staff());
create policy "enviar mensajes" on messages for insert
  with check (sender_id = auth.uid() and (student_id = auth.uid() or is_staff()));

-- Ejemplo: después de crear un usuario en Authentication → Users
-- (correo: codigo@uyariy.app, contraseña: PIN de 6 dígitos), registra su perfil:
-- insert into profiles (id, role, full_name, grade, section)
-- values ('UUID-DEL-USUARIO', 'student', 'Ana Quispe', '3ro', 'A');
