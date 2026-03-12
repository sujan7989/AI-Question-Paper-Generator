# Fix Blocked Users Functionality

## Problem
The blocked users count shows 0 and blocking doesn't work because the database is missing the required columns.

## Solution - Run SQL Script

### Step 1: Open Supabase SQL Editor

1. Go to: **Supabase Dashboard**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy and Run This SQL

```sql
-- Add blocked user functionality to user_profiles table

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
```

### Step 3: Run the Query

1. Paste the SQL above into the SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. You should see: **"Success. No rows returned"**

### Step 4: Refresh Your App

1. Go back to your app: https://quizzy-ai-paper-forge.vercel.app
2. Go to **User Management** page
3. Click **"Refresh"** button
4. Now try blocking a user!

---

## How It Works Now

### Block a User:
1. Click **"Block"** button next to any user
2. Confirm the action
3. User's `is_blocked` is set to `TRUE`
4. **Blocked Users** count updates immediately
5. User appears in the "Blocked Users" section

### Unblock a User:
1. Scroll to **"Blocked Users"** section (appears when there are blocked users)
2. Click **"Unblock User"** button
3. Confirm the action
4. User's `is_blocked` is set to `FALSE`
5. User can log in again

---

## Features Added

✅ **Accurate blocked users count** - Shows real number from database
✅ **Blocked Users section** - Dedicated area to view and manage blocked users
✅ **Unblock functionality** - Easy one-click unblock from the blocked users section
✅ **Visual indicators** - Red badges and styling for blocked users
✅ **Database persistence** - Blocks are saved in the database

---

## Troubleshooting

**If blocking still doesn't work:**

1. Check browser console for errors (F12 → Console tab)
2. Make sure the SQL script ran successfully in Supabase
3. Try refreshing the page (Ctrl+F5)
4. Check Supabase logs for any errors

**If you see "column does not exist" error:**
- The SQL script didn't run successfully
- Go back to Step 2 and run it again
- Make sure you're in the correct Supabase project

---

## Database Schema

After running the SQL, your `user_profiles` table will have:

- `is_blocked` (BOOLEAN) - TRUE if user is blocked, FALSE if active
- `banned_until` (TIMESTAMP) - Optional timestamp for timed bans

Both columns default to FALSE/NULL for existing users.
