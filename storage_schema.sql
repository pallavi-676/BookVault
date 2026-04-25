-- 🚀 STORAGE BUCKET SETUP: chapter-assets
-- Run this in your Supabase SQL Editor to enable image uploads in the Writing Room.

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chapter-assets', 'chapter-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Read Access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'chapter-assets');

-- 3. Allow Authenticated Insert Access
CREATE POLICY "Authenticated Insert Access" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chapter-assets');

-- 4. Allow Authenticated Delete Access
CREATE POLICY "Authenticated Delete Access" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'chapter-assets');
