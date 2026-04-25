-- Add social_links column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Comment to describe the column format
COMMENT ON COLUMN profiles.social_links IS 'Stores author social media links as { platform: "url" }. Supported: instagram, twitter, website.';

-- Update RLS if necessary (usuallyProfiles-Update policy already covers all columns for authenticated owners)
-- But ensuring public can READ social_links
ALTER POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);
