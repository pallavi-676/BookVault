-- 📚 BOOKVAULT PROFILE RLS HARDENING MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard) to ensure full sync of name, username, and profile metadata.

-- 1. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts and ensure idempotency
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- 3. Create full RLS Policies
-- SELECT: Anyone can read any profile (needed for messaging, public author view, following lists, notifications)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

-- INSERT: Authenticated users can insert their own profile matching their Auth ID
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Authenticated users can update their own profile fields
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- DELETE: Authenticated users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);
