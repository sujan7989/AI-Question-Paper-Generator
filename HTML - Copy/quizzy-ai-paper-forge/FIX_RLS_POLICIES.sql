-- ============================================
-- FIX ALL RLS POLICIES - COMPLETE SOLUTION
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes: "new row violates row-level security policy"

-- ============================================
-- STEP 1: CLEAN UP - Remove all existing policies
-- ============================================

-- Drop subjects policies
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;

-- Drop units policies
DROP POLICY IF EXISTS "Users can view units of their subjects" ON public.units;
DROP POLICY IF EXISTS "Users can insert units for their subjects" ON public.units;
DROP POLICY IF EXISTS "Users can update units of their subjects" ON public.units;
DROP POLICY IF EXISTS "Users can delete units of their subjects" ON public.units;

-- Drop question_papers policies
DROP POLICY IF EXISTS "Users can view their own question papers" ON public.question_papers;
DROP POLICY IF EXISTS "Users can insert their own question papers" ON public.question_papers;
DROP POLICY IF EXISTS "Users can update their own question papers" ON public.question_papers;
DROP POLICY IF EXISTS "Users can delete their own question papers" ON public.question_papers;

-- Drop profiles policies (if exists)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- ============================================
-- STEP 2: CREATE SUBJECTS POLICIES
-- ============================================

CREATE POLICY "Users can view their own subjects" 
    ON public.subjects 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects" 
    ON public.subjects 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" 
    ON public.subjects 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" 
    ON public.subjects 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 3: CREATE UNITS POLICIES
-- ============================================

CREATE POLICY "Users can view units of their subjects" 
    ON public.units 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert units for their subjects" 
    ON public.units 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update units of their subjects" 
    ON public.units 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete units of their subjects" 
    ON public.units 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

-- ============================================
-- STEP 4: CREATE QUESTION PAPERS POLICIES
-- ============================================

CREATE POLICY "Users can view their own question papers" 
    ON public.question_papers 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question papers" 
    ON public.question_papers 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question papers" 
    ON public.question_papers 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own question papers" 
    ON public.question_papers 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: CREATE PROFILES POLICIES (if table exists)
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" 
            ON public.profiles 
            FOR SELECT 
            USING (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "Users can insert their own profile" 
            ON public.profiles 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "Users can update their own profile" 
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ============================================
-- STEP 7: GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================

GRANT ALL ON public.subjects TO authenticated;
GRANT ALL ON public.units TO authenticated;
GRANT ALL ON public.question_papers TO authenticated;

-- Grant on profiles if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'GRANT ALL ON public.profiles TO authenticated';
    END IF;
END $$;

-- Grant on storage if needed
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ============================================
-- STEP 8: VERIFICATION
-- ============================================

-- Show success message
SELECT '✅ RLS POLICIES FIXED SUCCESSFULLY!' as status;

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- DONE! Your database is now ready!
-- ============================================
-- Next steps:
-- 1. Go to your app
-- 2. Create a new subject
-- 3. Upload PDF
-- 4. Generate questions
-- 5. Questions will match your PDF content!
-- ============================================
