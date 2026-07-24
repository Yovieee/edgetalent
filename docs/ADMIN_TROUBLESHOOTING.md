# EdgeTalent Admin Login & Password Reset Guide

This guide details how to configure, promote, and troubleshoot Administrator accounts and Password Resets in the EdgeTalent platform.

---

## 1. How to Promote a User to Admin Role

In EdgeTalent, authentication is managed by Supabase Auth, while page authorizations (`RoleGuard`) check `role` in the `public.profiles` table.

### Method A: Using the SQL Migration Helper
Run the SQL function created in migration `20260724100000_admin_setup_helper.sql`:

```sql
SELECT public.promote_user_to_admin('your-admin-email@example.com');
```

### Method B: Direct SQL Query
Execute the following query in the **Supabase SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-admin-email@example.com';
```

---

## 2. Configuring Password Reset ("Forgot Password") in Supabase

For the "Forgot Password" feature to properly send email reset links and redirect back to your app:

### Step 1: Whitelist Redirect URLs
1. Open your **Supabase Dashboard**.
2. Go to **Authentication** -> **URL Configuration**.
3. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: `https://edgetalent.space`
4. Add the following to **Redirect URLs**:
   - `http://localhost:5173/reset-password`
   - `http://localhost:5173/**`
   - `https://edgetalent.space/reset-password`
   - `https://edgetalent.space/**`

### Step 2: Avoid Email Rate Limits / Spam Filters
* By default, Supabase limits free projects to 3 emails per hour for builtin SMTP.
* To increase rate limits and ensure inbox delivery, configure Custom SMTP under **Project Settings** -> **Authentication** -> **SMTP Provider** (using Resend, SendGrid, Mailgun, or AWS SES).

---

## 3. Emergency Admin Recovery

If the admin password is lost or password reset emails fail to arrive:

1. **Direct Password Update via Supabase Dashboard**:
   - Go to **Supabase Dashboard** -> **Authentication** -> **Users**.
   - Search for the admin user.
   - Click the `...` menu -> **Edit user** / **Update Password**.
2. **Verify Admin Role**:
   - Run:
     ```sql
     SELECT id, email, role FROM public.profiles WHERE email = 'your-admin-email@example.com';
     ```
   - Ensure `role` is `'admin'`.
3. Log in via `/auth` with the new password.
