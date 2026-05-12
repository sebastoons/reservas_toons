-- ============================================================
-- SCHEMA RESERVAS TOONS - Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. TABLA DE PERFILES (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  first_name  TEXT DEFAULT '',
  last_name   TEXT DEFAULT '',
  role        TEXT CHECK (role IN ('ADMIN', 'COORD', 'TECH')) DEFAULT 'COORD',
  phone       TEXT,
  username    TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger: crear perfil automático al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Profiles
CREATE POLICY "Autenticados pueden ver todos los perfiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuario puede editar su propio perfil"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================================
-- 2. TABLA DE CITAS / RESERVAS
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  BIGSERIAL PRIMARY KEY,
  coordinator_id      UUID REFERENCES public.profiles(id),
  technician_id       UUID REFERENCES public.profiles(id),
  client_name         TEXT NOT NULL,
  client_email        TEXT,
  client_phone        TEXT,
  address             TEXT,
  work_type           TEXT DEFAULT 'INST'
                        CHECK (work_type IN ('INST','MANT','DESINST','REPAR','BLOQUEO','VACACIONES')),
  description         TEXT,
  assigned_by_name    TEXT,
  date                DATE NOT NULL,
  time                TIME NOT NULL,
  duration_estimated  TEXT DEFAULT '1 Hora 30 Minutos',
  status              TEXT DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','ACCEPTED','REJECTED','COMPLETED')),
  technician_message  TEXT,
  rating              SMALLINT CHECK (rating BETWEEN 1 AND 5),
  feedback_comment    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Appointments
CREATE POLICY "Ver propias citas"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    coordinator_id = auth.uid() OR
    technician_id  = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Coordinador puede crear citas"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (coordinator_id = auth.uid());

CREATE POLICY "Participantes pueden actualizar citas"
  ON public.appointments FOR UPDATE TO authenticated
  USING (coordinator_id = auth.uid() OR technician_id = auth.uid());

CREATE POLICY "Coordinador puede eliminar sus citas"
  ON public.appointments FOR DELETE TO authenticated
  USING (coordinator_id = auth.uid());
