-- 🚀 BOOKVAULT CONSOLIDATED PRODUCTION REPAIR
-- Apply this to your Supabase SQL Editor to finalize all tables/columns.

-- 1. PROFILE TABLE HARDENING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stories_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reading_time_ms BIGINT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 2. STORY & CHAPTER METRICS
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. NOTIFICATION DEDUPLICATION FINGERPRINT
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS fingerprint TEXT UNIQUE;

-- 4. REALTIME ENABLEMENT
-- Ensure realtime is subscribed to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    PERFORM (SELECT 'ALTER PUBLICATION supabase_realtime ADD TABLE notifications');
  END IF;
END $$;

-- 5. AGGREGATE TRIGGERS (SYNC COUNTS)

-- Trigger for Follow Counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Trigger for Story Counts
CREATE OR REPLACE FUNCTION update_author_story_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE profiles SET stories_count = COALESCE(stories_count, 0) + 1 WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET stories_count = GREATEST(0, COALESCE(stories_count, 0) - 1) WHERE id = OLD.author_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_story_change ON stories;
CREATE TRIGGER on_story_change
AFTER INSERT OR DELETE ON stories
FOR EACH ROW EXECUTE FUNCTION update_author_story_count();

-- 6. NOTIFICATION FINGERPRINT TRIGGER
CREATE OR REPLACE FUNCTION generate_notification_fingerprint()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fingerprint := NEW.recipient_id::text || ':' || 
                       NEW.actor_id::text || ':' || 
                       NEW.type || ':' || 
                       COALESCE(NEW.story_id::text, 'null') || ':' || 
                       COALESCE(NEW.chapter_id::text, 'null') || ':' || 
                       COALESCE(NEW.comment_id::text, 'null');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_notification_upsert ON notifications;
CREATE TRIGGER on_notification_upsert
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION generate_notification_fingerprint();

-- 7. CLEANUP POLICY
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);
