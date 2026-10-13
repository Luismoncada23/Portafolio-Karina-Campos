-- =====================================================================
-- Configuración de Supabase para el portafolio
-- Pégalo completo en: Supabase → SQL Editor → New query → Run
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================

-- 1) Tabla con el contenido del portafolio (una sola fila)
create table if not exists public.portfolio_content (
  id         int primary key default 1,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  constraint portfolio_content_una_sola_fila check (id = 1)
);

alter table public.portfolio_content enable row level security;

-- Cualquier visitante puede LEER el contenido (es lo que se muestra en la web)
drop policy if exists "Lectura publica" on public.portfolio_content;
create policy "Lectura publica" on public.portfolio_content
  for select to anon, authenticated using (true);

-- Solo un usuario con sesión iniciada puede CREAR o CAMBIAR el contenido
drop policy if exists "Solo el dueno inserta" on public.portfolio_content;
create policy "Solo el dueno inserta" on public.portfolio_content
  for insert to authenticated with check (true);

drop policy if exists "Solo el dueno actualiza" on public.portfolio_content;
create policy "Solo el dueno actualiza" on public.portfolio_content
  for update to authenticated using (true) with check (true);

-- 2) Carpeta pública para las fotos
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

drop policy if exists "Ver imagenes" on storage.objects;
create policy "Ver imagenes" on storage.objects
  for select to public using (bucket_id = 'portfolio-media');

drop policy if exists "Subir imagenes" on storage.objects;
create policy "Subir imagenes" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio-media');

drop policy if exists "Actualizar imagenes" on storage.objects;
create policy "Actualizar imagenes" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio-media');

drop policy if exists "Borrar imagenes" on storage.objects;
create policy "Borrar imagenes" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio-media');

-- =====================================================================
-- IMPORTANTE (no es SQL, se hace en el panel de Supabase):
--   Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
--   Así nadie más puede crear cuentas; solo existirá la del dueño.
--
-- OPCIONAL (más estricto): permitir escribir SOLO a tu correo. Reemplaza
-- las dos políticas del dueño por estas, cambiando el correo:
--   using ((auth.jwt() ->> 'email') = 'tu-correo@dominio.com')
--   with check ((auth.jwt() ->> 'email') = 'tu-correo@dominio.com')
-- =====================================================================
