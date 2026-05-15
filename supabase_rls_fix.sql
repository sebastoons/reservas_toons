-- ============================================================
-- FIX RLS: Permitir lectura pública (coordinador sin login)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- PROFILES: permitir lectura a todos (anon + authenticated)
DROP POLICY IF EXISTS "Autenticados pueden ver todos los perfiles" ON public.profiles;
CREATE POLICY "Lectura publica de perfiles"
  ON public.profiles FOR SELECT USING (true);

-- APPOINTMENTS: permitir lectura a todos (anon + authenticated)
DROP POLICY IF EXISTS "Ver propias citas" ON public.appointments;
CREATE POLICY "Lectura publica de citas"
  ON public.appointments FOR SELECT USING (true);
