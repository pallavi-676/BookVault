-- 🛡️ MASTER ACCOUNT DELETION CASCADE REPAIR 🛡️
-- Run this in your Supabase SQL Editor to ensure full data wipeout during account deletion.

-- 1. Ensure Books Cascade
ALTER TABLE IF EXISTS public.books
  DROP CONSTRAINT IF EXISTS books_user_id_fkey,
  ADD CONSTRAINT books_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 2. Ensure Reading Progress Cascade
ALTER TABLE IF EXISTS public.reading_progress
  DROP CONSTRAINT IF EXISTS reading_progress_user_id_fkey,
  ADD CONSTRAINT reading_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 3. Ensure Annotations Cascade
ALTER TABLE IF EXISTS public.annotations
  DROP CONSTRAINT IF EXISTS annotations_user_id_fkey,
  ADD CONSTRAINT annotations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 4. Ensure Bookmarks Cascade
ALTER TABLE IF EXISTS public.bookmarks
  DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey,
  ADD CONSTRAINT bookmarks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 5. Ensure Reports Cascade
ALTER TABLE IF EXISTS public.reports
  DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
  ADD CONSTRAINT reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 6. Ensure Messages Cascade
ALTER TABLE IF EXISTS public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey,
  ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Hardening Profile Deletion Policy
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);

-- 8. Enable Cascade for Chapters if not set
ALTER TABLE IF EXISTS public.chapters
  DROP CONSTRAINT IF EXISTS chapters_story_id_fkey,
  ADD CONSTRAINT chapters_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
