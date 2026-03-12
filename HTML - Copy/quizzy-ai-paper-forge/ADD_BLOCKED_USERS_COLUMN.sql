-- Add blocked user functionality to user_profiles table
-- Run this in Supabase SQL Editor

-- Add the is_blocked column (simpler boolean approach)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Add the banned_until column (for future use with timed bans)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_blocked 
ON user_profiles(is_blocked);

CREATE INDEX IF NOT EXISTS idx_user_profiles_banned_until 
ON user_profiles(banned_until);

-- Add comments to document the columns
COMMENT ON COLUMN user_profiles.is_blocked IS 'Boolean flag indicating if user is blocked. TRUE means blocked, FALSE means active.';
COMMENT ON COLUMN user_profiles.banned_until IS 'Timestamp until which the user is banned. NULL means not banned or using is_blocked instead.';
