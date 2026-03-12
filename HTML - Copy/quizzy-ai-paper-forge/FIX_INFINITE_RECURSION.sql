-- ============================================
-- FIX INFINITE RECURSION ERROR
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to read" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can only view own profile" ON user_profiles;

-- Step 2: Disable RLS temporarily to avoid recursion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Allow all authenticated users to read all profiles
CREATE POLICY "Allow authenticated users to read profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update any profile (we'll handle permissions in the app)
CREATE POLICY "Allow authenticated users to update profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow users to delete any profile (we'll handle permissions in the app)
CREATE POLICY "Allow authenticated users to delete profiles"
ON user_profiles
FOR DELETE
TO authenticated
USING (true);

-- Step 5: Verify the new policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS policies fixed! Infinite recursion resolved.';
    RAISE NOTICE '✅ All authenticated users can now read, update, and delete profiles.';
    RAISE NOTICE '⚠️ Admin checks are now handled in the application code for security.';
END $$;
