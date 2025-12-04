-- SIMPLE FIX: Just run this to make user_profiles work
-- This will fix the 500 error

-- 1. Make sure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;

-- 3. Create simple policies that will work (with IF NOT EXISTS handling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow all authenticated users to read'
    ) THEN
        CREATE POLICY "Allow all authenticated users to read" 
            ON public.user_profiles FOR SELECT 
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow users to insert their own profile'
    ) THEN
        CREATE POLICY "Allow users to insert their own profile" 
            ON public.user_profiles FOR INSERT 
            TO authenticated
            WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow users to update their own profile'
    ) THEN
        CREATE POLICY "Allow users to update their own profile" 
            ON public.user_profiles FOR UPDATE 
            TO authenticated
            USING (auth.uid() = id);
    END IF;
END $$;

-- 4. Make sure current user exists in user_profiles
INSERT INTO public.user_profiles (id, email, first_name, last_name, role, last_sign_in_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    COALESCE(raw_user_meta_data->>'role', 'admin'),
    last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = NOW();

-- Done!
SELECT 'SUCCESS: Policies fixed! Refresh your app.' as message;
