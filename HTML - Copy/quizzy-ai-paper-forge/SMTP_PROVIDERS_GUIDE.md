# Professional SMTP Providers for Supabase

## Email confirmation is important! Here are reliable alternatives:

---

## Option 1: Resend (Easiest & Best for Supabase)

**Why Resend?**
- ✅ Built specifically for developers
- ✅ 100 emails/day FREE
- ✅ Super easy setup (2 minutes)
- ✅ Works perfectly with Supabase
- ✅ Modern and reliable

### Setup Steps:

1. **Create Account**
   - Go to: https://resend.com/signup
   - Sign up with GitHub or Email
   - Verify your email

2. **Add Domain or Email**
   - Go to: Domains → Add Domain
   - OR use their test domain: `onboarding.resend.dev`
   - For test domain: Skip verification, it works immediately!

3. **Create API Key**
   - Go to: API Keys → Create API Key
   - Name: `Supabase`
   - Permission: `Sending access`
   - Copy the API key (starts with `re_`)

4. **Configure Supabase**
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API key]
   Sender email: onboarding@resend.dev
   Sender name: Quizzy AI Paper Forge
   ```

5. **Save and Test!**

---

## Option 2: Mailgun (Very Reliable)

**Why Mailgun?**
- ✅ 5,000 emails/month FREE
- ✅ Used by big companies
- ✅ Very reliable
- ✅ Easy setup

### Setup Steps:

1. **Create Account**
   - Go to: https://signup.mailgun.com/new/signup
   - Sign up for free account
   - Verify your email

2. **Get SMTP Credentials**
   - Go to: Sending → Domain settings → SMTP credentials
   - Click "Reset password" to get SMTP password
   - Copy the password

3. **Configure Supabase**
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: postmaster@sandboxXXXXX.mailgun.org
   Password: [Your SMTP password]
   Sender email: postmaster@sandboxXXXXX.mailgun.org
   Sender name: Quizzy AI Paper Forge
   ```

4. **Save and Test!**

---

## Option 3: Brevo (Formerly Sendinblue)

**Why Brevo?**
- ✅ 300 emails/day FREE
- ✅ Very generous free tier
- ✅ Easy to use
- ✅ Reliable

### Setup Steps:

1. **Create Account**
   - Go to: https://app.brevo.com/account/register
   - Sign up for free account
   - Verify your email

2. **Create SMTP Key**
   - Go to: Settings → SMTP & API → SMTP
   - Click "Create a new SMTP key"
   - Name: `Supabase`
   - Copy the key

3. **Configure Supabase**
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   Username: [Your Brevo email]
   Password: [Your SMTP key]
   Sender email: [Your verified email]
   Sender name: Quizzy AI Paper Forge
   ```

4. **Save and Test!**

---

## Option 4: Amazon SES (Most Professional)

**Why Amazon SES?**
- ✅ 62,000 emails/month FREE (first year)
- ✅ Used by major companies
- ✅ Most reliable
- ✅ Professional

### Setup Steps:

1. **Create AWS Account**
   - Go to: https://aws.amazon.com/ses/
   - Sign up (requires credit card but won't charge)

2. **Verify Email**
   - Go to: SES → Verified identities
   - Click "Create identity"
   - Choose "Email address"
   - Enter: sujan7989@gmail.com
   - Verify the email

3. **Create SMTP Credentials**
   - Go to: SES → SMTP settings
   - Click "Create SMTP credentials"
   - Download the credentials

4. **Configure Supabase**
   ```
   Host: email-smtp.us-east-1.amazonaws.com
   Port: 587
   Username: [From downloaded credentials]
   Password: [From downloaded credentials]
   Sender email: sujan7989@gmail.com
   Sender name: Quizzy AI Paper Forge
   ```

5. **Request Production Access** (if needed)
   - SES starts in sandbox mode
   - Can send to verified emails only
   - Request production access in SES console

---

## My Top Recommendation: Resend

**Why Resend is the best choice:**
1. ✅ Takes only 2 minutes to setup
2. ✅ Works immediately with test domain
3. ✅ No verification needed for testing
4. ✅ Built for developers
5. ✅ 100 emails/day free (enough for your review)

---

## Quick Start with Resend (2 Minutes):

1. Go to: https://resend.com/signup
2. Sign up with your email
3. Go to: API Keys → Create API Key
4. Copy the API key
5. In Supabase SMTP settings:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `[Your API key]`
   - Sender email: `onboarding@resend.dev`
   - Sender name: `Quizzy AI Paper Forge`
6. Save and test!

---

**Which provider do you want to try? I recommend Resend!**
