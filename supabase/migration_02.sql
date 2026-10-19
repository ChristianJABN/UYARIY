-- UYARIY · módulo 2. Ejecutar UNA vez en SQL Editor (después de schema.sql).

-- Bucket privado para evidencias
insert into storage.buckets (id, name, public) values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy "subir evidencia propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver evidencia propia o staff" on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and ((storage.foldername(name))[1] = auth.uid()::text or is_staff()));

-- Si el estudiante responde "peor", el caso vuelve a prioridad alta y pendiente
create function followup_escalates() returns trigger
language plpgsql security definer as $$
begin
  if new.feeling = 'peor' then
    update reports set priority = 'alta', status = 'pendiente' where id = new.report_id;
  end if;
  return new;
end $$;
create trigger on_followup after insert on followups
  for each row execute function followup_escalates();
