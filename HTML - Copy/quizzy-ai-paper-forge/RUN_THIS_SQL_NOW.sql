-- ============================================
-- FIX BLOCKED USERS FUNCTIONALITY
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Add is_blocked column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_blocked'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_blocked column';
    ELSE
        RAISE NOTICE 'is_blocked column already exists';
    END IF;
END $$;

-- Step 2: Add banned_until column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'banned_until'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN banned_until TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added banned_until column';
    ELSE
        RAISE NOTICE 'banned_until column already exists';
    END IF;
END $$;

-- Step 3: Set default values for existing users
UPDATE user_profiles 
SET is_blocked = FALSE 
WHERE is_blocked IS NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_blocked 
ON user_profiles(is_blocked);

CREATE INDEX IF NOT EXISTS idx_user_profiles_banned_until 
ON user_profiles(banned_until);

-- Step 5: Add comments
COMMENT ON COLUMN user_profiles.is_blocked IS 'Boolean flag: TRUE = blocked, FALSE = active';
COMMENT ON COLUMN user_profiles.banned_until IS 'Timestamp until user is banned. NULL = not banned';

-- Step 6: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('is_blocked', 'banned_until')
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Blocked users functionality has been set up successfully!';
    RAISE NOTICE '✅ You can now block and unblock users in the User Management page';
END $$;
