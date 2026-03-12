# 📧 Gmail SMTP Setup for Supabase (Remove Email Rate Limit)

## Problem
Supabase free tier only allows 2 emails per hour. You're getting "email rate limit exceeded" error.

## Solution
Configure Gmail SMTP to send 500 emails per day instead of 2 per hour.

---

## Step 1: Get Gmail App Password

1. **Open this link**: https://myaccount.google.com/apppasswords
   
2. **If you see "App passwords not available"**:
   - First enable 2-Step Verification: https://myaccount.google.com/signinoptions/two-step-verification
   - Click "Get Started" and follow the steps
   - Come back to: https://myaccount.google.com/apppasswords

3. **Create App Password**:
   - App name: Type `Supabase` or `Quizzy AI`
   - Click "Create"
   - You'll see a 16-character password like: `abcd efgh ijkl mnop`
   - **COPY THIS PASSWORD** (you'll need it in Step 2)

---

## Step 2: Configure Supabase SMTP

You are already in the right place: **Supabase Dashboard → Authentication → Emails → SMTP Settings**

Fill in these values:

```
Hostname: smtp.gmail.com
Port: 587
Username: [YOUR_GMAIL_ADDRESS]
Password: [16-CHARACTER APP PASSWORD FROM STEP 1]
Sender email: [YOUR_GMAIL_ADDRESS]
Sender name: Quizzy AI Paper Forge
```

### Example (replace with YOUR details):
```
Hostname: smtp.gmail.com
Port: 587
Username: sujan7989@gmail.com
Password: abcd efgh ijkl mnop
Sender email: sujan7989@gmail.com
Sender name: Quizzy AI Paper Forge
```

**IMPORTANT**: 
- Change Port from `465` to `587`
- Use the 16-character app password, NOT your regular Gmail password
- Username and Sender email should be the SAME Gmail address

---

## Step 3: Save and Test

1. Click **"Save changes"** button at the bottom
2. Wait 10 seconds for changes to apply
3. Go to your website: https://quizzy-ai-paper-forge.vercel.app
4. Try to sign up with a new email
5. You should receive the confirmation email within seconds!

---

## ✅ After Setup

- **Old limit**: 2 emails per hour
- **New limit**: 500 emails per day
- **No more rate limit errors!**

---

## Troubleshooting

**If you get "Invalid credentials" error:**
- Make sure you're using the 16-character app password, not your regular password
- Make sure 2-Step Verification is enabled on your Gmail account

**If emails still don't send:**
- Wait 1-2 minutes after saving SMTP settings
- Check Gmail "Sent" folder to see if emails are being sent
- Try signing up with a different email address

---

## Need Help?

If you're stuck, tell me:
1. Which step you're on
2. What error you see (if any)
3. Screenshot of the SMTP form (hide the password)
