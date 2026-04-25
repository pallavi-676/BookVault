# 🚀 BookVault Deployment Guide

Your platform is now stabilized, secured, and has passed a full master audit. Follow these steps to take BookVault live and share it with your first beta users.

---

## Step 1: GitHub Repository Setup
Before deploying, you need to push your code to a secure repository.

1. **Initialize Git** (if not already done):
   ```bash
   git init
   ```
2. **Add Files**:
   ```bash
   git add .
   ```
   *Note: Our updated `.gitignore` will automatically prevent `.env.local` and your database keys from being staged.*
3. **Commit**:
   ```bash
   git commit -m "feat: gold candidate for soft launch"
   ```
4. **Push to GitHub**:
   * Create a new private/public repository on GitHub.
   * Follow the GitHub instructions to link your local folder and push your code.

---

## Step 2: Deployment to Vercel (Recommended)
Vercel is the industry standard for Vite-based React apps like BookVault.

1. **Login**: Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Import Project**: Click **"Add New"** > **"Project"** and select the `BookVault` repository.
3. **Configure Build**:
   * **Framework Preset**: Vite.
   * **Root Directory**: `./` (default).
4. **CRITICAL: Environment Variables**:
   In the "Environment Variables" section, copy the keys from your `.env.local` file:
   * `VITE_SUPABASE_URL` = (Your Supabase URL)
   * `VITE_SUPABASE_ANON_KEY` = (Your Supabase Anon Key)
5. **Deploy**: Click **"Deploy"**. Your site will be live in ~60 seconds.

---

## Step 3: Production Database Verification
Once the site is live, perform these two final checks in your [Supabase Dashboard](https://supabase.com):

1. **Auth Settings**:
   * Go to **Authentication** > **Providers** > **Email**.
   * Ensure **"Confirm Email"** is enabled if you want to verify real user accounts.
2. **Realtime Activation**:
   * Go to **Database** > **Publications**.
   * Ensure the `supabase_realtime` publication includes the `notifications` and `counts` tables to enable live updates on the site.

---

## 🔒 Security Checklist
*   [x] `.env.local` is ignored in `.gitignore`.
*   [x] Database RLS (Row Level Security) is enabled for all tables.
*   [x] Public Landing Page is configured for logged-out users.
*   [x] All hardcoded secrets removed from source code.

**BookVault is officially ready for the world. Congratulations on reaching the Soft Launch!**
