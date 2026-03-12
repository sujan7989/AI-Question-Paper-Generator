-- ============================================
-- FIX RLS POLICIES FOR BLOCKING USERS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Step 2: Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can only update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can only view own profile" ON user_profiles;

-- Step 3: Create new policies that allow admins to block users

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'admin'
  )
  OR auth.uid() = id
);

-- Allow admins to update all profiles (including blocking)
CREATE POLICY "Admins can update all profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'admin'
  )
);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'admin'
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 4: Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE '✅ Admins can now block, unblock, and delete users';
END $$;
