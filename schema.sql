-- =====================================================================
-- LINGOVIBE — COMPLETE DATABASE SCHEMA
-- Project: dhsaunoaqmizpqukcpfl
-- Run this script in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run: uses DROP POLICY IF EXISTS before every CREATE POLICY
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 1: CREATE TABLES
-- ─────────────────────────────────────────────────────────────────────

-- 1a. profiles — extends Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT        NOT NULL,
    role         TEXT        NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    full_name    TEXT        NOT NULL DEFAULT 'Anonymous Learner',
    current_level TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 1b. assignments — teacher-created exercises
CREATE TABLE IF NOT EXISTS public.assignments (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title                TEXT        NOT NULL,
    type                 TEXT        NOT NULL CHECK (type IN ('matching', 'sentence', 'translation', 'speech_practice')),
    content              JSONB       NOT NULL DEFAULT '{}',
    assigned_student_ids UUID[]      DEFAULT NULL,
    comment              TEXT        DEFAULT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 1c. student_progress — records every exercise completion
CREATE TABLE IF NOT EXISTS public.student_progress (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_id UUID        REFERENCES public.assignments(id) ON DELETE SET NULL,
    type          TEXT        NOT NULL CHECK (type IN ('level_test', 'assignment')),
    score         INTEGER     NOT NULL DEFAULT 0,
    max_score     INTEGER     NOT NULL DEFAULT 0,
    feedback      TEXT,
    completed_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 1d. peer_messages — student-to-student conversations (text and voice messages)
CREATE TABLE IF NOT EXISTS public.peer_messages (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT        NOT NULL CHECK (message_type IN ('text', 'voice')) DEFAULT 'text',
    content      TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 1e. speaking_messages — AI Speaking Club conversations history (persisted in DB)
CREATE TABLE IF NOT EXISTS public.speaking_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender      TEXT        NOT NULL CHECK (sender IN ('user', 'ai')),
    text        TEXT        NOT NULL,
    feedback    TEXT        DEFAULT NULL,
    corrections JSONB       DEFAULT NULL,
    upgrade     TEXT        DEFAULT NULL,
    vocab_boost TEXT        DEFAULT NULL,
    scores      JSONB       DEFAULT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 2: ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 3: RLS POLICIES
-- Drop first so this script is safe to re-run multiple times.
-- ─────────────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles"       ON public.profiles;

-- Any logged-in user can read all profiles
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- A user may only update their own row
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- The trigger function runs with SECURITY DEFINER so it needs no INSERT policy,
-- but we add one for service_role safety:
CREATE POLICY "Service role can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ── assignments ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can insert assignments"          ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update own assignments"      ON public.assignments;
DROP POLICY IF EXISTS "Teachers can delete own assignments"      ON public.assignments;

-- All authenticated users can browse assignments (if they are assigned or if they are the teacher)
CREATE POLICY "Authenticated users can read assignments" ON public.assignments
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (
            assigned_student_ids IS NULL 
            OR auth.uid() = ANY(assigned_student_ids)
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'teacher'
            )
        )
    );

-- Only teachers can publish new assignments
CREATE POLICY "Teachers can insert assignments" ON public.assignments
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Teachers can edit their own assignments
CREATE POLICY "Teachers can update own assignments" ON public.assignments
    FOR UPDATE USING (
        auth.uid() = teacher_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Teachers can remove their own assignments
CREATE POLICY "Teachers can delete own assignments" ON public.assignments
    FOR DELETE USING (
        auth.uid() = teacher_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ── student_progress ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can insert own progress"  ON public.student_progress;
DROP POLICY IF EXISTS "Students can read own progress"   ON public.student_progress;
DROP POLICY IF EXISTS "Teachers can read all progress"   ON public.student_progress;

-- Students may only record their own results
CREATE POLICY "Students can insert own progress" ON public.student_progress
    FOR INSERT WITH CHECK (
        auth.uid() = student_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- Students read only their own rows
CREATE POLICY "Students can read own progress" ON public.student_progress
    FOR SELECT USING (auth.uid() = student_id);

-- Teachers may read every student's progress (for dashboard analytics)
CREATE POLICY "Teachers can read all progress" ON public.student_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ── peer_messages ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own peer messages" ON public.peer_messages;
CREATE POLICY "Users can insert own peer messages" ON public.peer_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can read own peer conversations" ON public.peer_messages;
CREATE POLICY "Users can read own peer conversations" ON public.peer_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ── speaking_messages ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can insert own speaking messages" ON public.speaking_messages;
CREATE POLICY "Students can insert own speaking messages" ON public.speaking_messages
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can read own speaking conversations" ON public.speaking_messages;
CREATE POLICY "Students can read own speaking conversations" ON public.speaking_messages
    FOR SELECT USING (
        auth.uid() = student_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 4: TRIGGER — Auto-create profile on Auth sign-up
-- ─────────────────────────────────────────────────────────────────────

-- The trigger function reads role & full_name from user_metadata supplied
-- during supabase.auth.signUp({ options: { data: { role, full_name } } })
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name, current_level, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role',      'student'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous Learner'),
        NULL,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;   -- safe against duplicate inserts
    RETURN NEW;
END;
$$;

-- Bind the trigger to auth.users (drop first for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 5: HELPER VIEW (optional, useful for teacher dashboard)
-- ─────────────────────────────────────────────────────────────────────

-- A convenient read-only view joining students with their latest level and progress count
CREATE OR REPLACE VIEW public.student_overview AS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.current_level,
    p.created_at,
    COUNT(sp.id) FILTER (WHERE sp.type = 'assignment') AS completed_assignments,
    COUNT(sp.id) FILTER (WHERE sp.type = 'level_test') AS level_tests_taken
FROM public.profiles p
LEFT JOIN public.student_progress sp ON sp.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.email, p.current_level, p.created_at;

-- =====================================================================
-- ✅ Script complete. All tables, policies, and triggers are ready.
-- =====================================================================
