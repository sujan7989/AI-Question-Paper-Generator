# Disable Email Confirmation in Supabase

## Quick Fix for "Error sending confirmation email"

Since Gmail SMTP is not working, disable email confirmation temporarily:

### Steps:

1. Go to: **Supabase Dashboard**
2. Click: **Authentication** (left sidebar)
3. Click: **Providers** tab
4. Find: **Email** provider
5. Scroll down to: **Confirm email**
6. **Toggle OFF** the "Confirm email" switch
7. Click: **Save**

### What This Does:

- ✅ Users can sign up immediately without email confirmation
- ✅ No more "Error sending confirmation email" error
- ✅ Your app works for everyone
- ⚠️ Less secure (anyone can sign up with any email)

### For Production (After Review):

You can re-enable email confirmation later when you have time to fix Gmail SMTP properly.

---

## Alternative: Use Supabase's Built-in Email (2 emails/hour)

If you want to keep email confirmation:

1. Go to: **Supabase Dashboard → Authentication → Emails → SMTP Settings**
2. Click: **Disable custom SMTP** button at the top
3. This will use Supabase's default email (2 emails per hour limit)
4. At least it will work for testing during your review

---

Choose one option and tell me which one you want to do!
