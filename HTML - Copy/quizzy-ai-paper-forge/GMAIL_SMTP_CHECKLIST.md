# Gmail SMTP Troubleshooting Checklist

## Problem: "Error sending confirmation email"

This means Gmail is blocking Supabase from sending emails. Follow this checklist:

---

## ✅ Checklist:

### 1. Gmail Account Settings

- [ ] **2-Step Verification is ON**
  - Go to: https://myaccount.google.com/signinoptions/two-step-verification
  - Must show "ON" (not OFF)
  - If OFF, click "Get Started" and enable it

- [ ] **App Password is Generated**
  - Go to: https://myaccount.google.com/apppasswords
  - Create new app password named "Supabase"
  - Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)
  - **Important**: Remove all spaces when pasting into Supabase

- [ ] **"Less secure app access" is OFF** (this is good - we use app passwords instead)

---

### 2. Supabase SMTP Settings

Go to: **Supabase Dashboard → Authentication → Emails → SMTP Settings**

Check these values:

```
✅ Sender email address: sujan7989@gmail.com
✅ Sender name: Quizzy AI Paper Forge
✅ Host: smtp.gmail.com
✅ Port: 587 (NOT 465!)
✅ Minimum interval: 60
✅ Username: sujan7989@gmail.com
✅ Password: [16-char app password WITHOUT spaces]
```

**Critical**: Port MUST be 587, not 465!

---

### 3. Common Mistakes

❌ **Using regular Gmail password** → Use app password instead
❌ **Port 465** → Change to 587
❌ **Spaces in app password** → Remove all spaces (abcdefghijklmnop)
❌ **2-Step Verification OFF** → Must be ON
❌ **Wrong Gmail address** → Must match in Username and Sender email

---

### 4. Alternative: Use SendGrid (Free & Professional)

If Gmail still doesn't work, use SendGrid instead:

**Why SendGrid?**
- ✅ Free tier: 100 emails/day
- ✅ More reliable than Gmail
- ✅ Professional email delivery
- ✅ Works with Supabase perfectly

**Setup (5 minutes):**

1. **Create SendGrid Account**
   - Go to: https://signup.sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create API Key**
   - Go to: Settings → API Keys
   - Click "Create API Key"
   - Name: "Supabase"
   - Permissions: "Full Access"
   - Copy the API key (starts with `SG.`)

3. **Verify Sender Email**
   - Go to: Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter: sujan7989@gmail.com
   - Check your email and click verification link

4. **Configure Supabase**
   - Go to: Supabase → Authentication → Emails → SMTP Settings
   - Fill in:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [Your SendGrid API key]
     Sender email: sujan7989@gmail.com
     Sender name: Quizzy AI Paper Forge
     ```
   - Click "Save changes"

5. **Test**
   - Try signing up on your website
   - Should work immediately!

---

## Which Option Do You Want?

**Option A: Fix Gmail SMTP** (might take 30+ minutes of troubleshooting)
- Follow checklist above
- Check Supabase logs for errors
- Try different settings

**Option B: Use SendGrid** (5 minutes, guaranteed to work)
- More reliable
- Professional
- Free 100 emails/day
- Used by many production apps

---

**I recommend Option B (SendGrid) - it's faster and more reliable!**

Tell me which option you want to try.
