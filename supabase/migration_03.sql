-- UYARIY · módulo 3. Ejecutar UNA vez en SQL Editor (después de migration_02.sql).

alter table profiles add column if not exists staff_kind text check (staff_kind in ('psicologo','tutor'));
update profiles set staff_kind = 'tutor' where role = 'staff' and staff_kind is null;
alter table reports add column if not exists comment text;

create function is_psychologist() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'staff' and staff_kind = 'psicologo');
$$;

-- Mensajes urgentes: solo el estudiante y los psicólogos
drop policy if exists "ver mensajes propios o staff" on messages;
drop policy if exists "enviar mensajes" on messages;
create policy "ver mensajes" on messages for select using (student_id = auth.uid() or is_psychologist());
create policy "enviar mensajes" on messages for insert
  with check (sender_id = auth.uid() and (student_id = auth.uid() or is_psychologist()));

-- Citas
create table appointments (
  id bigserial primary key,
  student_id uuid not null references profiles(id) on delete cascade,
  slot timestamptz not null,
  status text not null default 'agendada' check (status in ('agendada','cancelada')),
  created_at timestamptz not null default now()
);
create unique index one_booking_per_slot on appointments(slot) where status = 'agendada';
alter table appointments enable row level security;
create policy "ver citas" on appointments for select using (student_id = auth.uid() or is_staff());
create policy "agendar cita" on appointments for insert with check (student_id = auth.uid());
create policy "cancelar cita" on appointments for update using (student_id = auth.uid());

create function taken_slots() returns setof timestamptz
language sql security definer stable as $$
  select slot from appointments where status = 'agendada' and slot > now();
$$;

-- Marca a tu psicólogo (cambia el UID):
-- update profiles set staff_kind = 'psicologo' where id = 'UID-DEL-PSICOLOGO';
