-- IDENTITY HARDENING: Ensure the profiles table has all necessary identity columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- IDENTITY REGISTRY: Automatically create a profile row for every new user
-- This solves the "Ghost User" problem in notifications and follows.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url',
    'reader'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on every signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 0. Follows Table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, comment_id)
);

-- 3. Story Likes Table
CREATE TABLE IF NOT EXISTS story_likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, story_id)
);

-- 4. Chapter Likes Table
CREATE TABLE IF NOT EXISTS chapter_likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, chapter_id)
);

-- 5. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, story_id)
);

-- 6. Library/Wishlist Table
-- Expanded categories to allow full progress tracking.
CREATE TABLE IF NOT EXISTS wishlists (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    category TEXT CHECK (category IN ('read_later', 'favorites', 'currently_reading', 'finished')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, story_id, category)
);

-- Policy update: Ensure it exists
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'new_chapter', 'chapter_update', 'story_like', 'follow', etc.
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fingerprint TEXT UNIQUE -- Composite deterministic key to handle NULL-safe deduplication
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Polices for Comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit/delete own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Polices for Likes
CREATE POLICY "Anyone can view likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle own likes" ON comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view story likes" ON story_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle story likes" ON story_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view chapter likes" ON chapter_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle chapter likes" ON chapter_likes FOR ALL USING (auth.uid() = user_id);

-- Polices for Ratings
CREATE POLICY "Anyone can view average ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings" ON ratings FOR ALL USING (auth.uid() = user_id);

-- Polices for Wishlist
CREATE POLICY "Users can view own wishlist" ON wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Policies for Follows
CREATE POLICY "Anyone can view follower relationships" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Policies for Notifications (Definitive 403 Fix)
-- Actors (creators) need INSERT and UPDATE to handle deduplication/upsert and conflict resolution.
-- Recipients (owners) need SELECT to see the feed and UPDATE to mark as read.

DROP POLICY IF EXISTS "Notifications are viewable by recipient" ON notifications;
DROP POLICY IF EXISTS "Notifications are insertable by actor" ON notifications;
DROP POLICY IF EXISTS "Notifications are updatable by recipient" ON notifications;
DROP POLICY IF EXISTS "Actors can manage own notifications" ON notifications;

-- 1. Actors can Create and Resolve Conflicts (Required for .upsert in frontend)
CREATE POLICY "Actors can manage own notifications" ON notifications 
    FOR ALL
    USING (auth.uid() = actor_id)
    WITH CHECK (auth.uid() = actor_id);

-- 2. Recipients can view their activity feed
CREATE POLICY "Recipients can view own notifications" ON notifications 
    FOR SELECT
    USING (auth.uid() = recipient_id);

-- 3. Recipients can mark as read
CREATE POLICY "Recipients can update read status" ON notifications 
    FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Automated Fingerprint Generation
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

CREATE TRIGGER on_notification_upsert
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION generate_notification_fingerprint();

-- 8. Counters & Aggregates Triggers

-- Update Story average rating and count in stories table (assuming columns exist)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_story_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'ratings') THEN
        UPDATE stories 
        SET 
            average_rating = (SELECT COALESCE(AVG(rating), 0) FROM ratings WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)),
            ratings_count = (SELECT COUNT(*) FROM ratings WHERE story_id = COALESCE(NEW.story_id, OLD.story_id))
        WHERE id = COALESCE(NEW.story_id, OLD.story_id);
    ELSIF (TG_TABLE_NAME = 'story_likes') THEN
        IF (TG_OP = 'INSERT') THEN
            UPDATE stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE stories SET likes_count = likes_count - 1 WHERE id = OLD.story_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_change
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_story_metrics();

CREATE TRIGGER on_story_like_change
    AFTER INSERT OR DELETE ON story_likes
    FOR EACH ROW EXECUTE FUNCTION update_story_metrics();

-- Chapter Liked Trigger
CREATE OR REPLACE FUNCTION update_chapter_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE chapters SET likes_count = likes_count + 1 WHERE id = NEW.chapter_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE chapters SET likes_count = likes_count - 1 WHERE id = OLD.chapter_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_like_change
    AFTER INSERT OR DELETE ON chapter_likes
    FOR EACH ROW EXECUTE FUNCTION update_chapter_likes();

-- Comment Liked Trigger
CREATE OR REPLACE FUNCTION update_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes();

-- 9. Notification Triggers

-- Trigger for Comment Replies
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.parent_id IS NOT NULL) THEN
        INSERT INTO notifications (recipient_id, actor_id, type, story_id, chapter_id, comment_id)
        SELECT 
            parent.user_id, 
            NEW.user_id, 
            'reply', 
            NEW.story_id, 
            NEW.chapter_id, 
            NEW.id
        FROM comments parent
        WHERE parent.id = NEW.parent_id
        AND parent.user_id != NEW.user_id; -- Don't notify self
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reply_created
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- Trigger for New Published Chapters
-- Trigger for New/Updated Published Chapters
CREATE OR REPLACE FUNCTION notify_on_chapter_published()
RETURNS TRIGGER AS $$
DECLARE
    notif_type TEXT;
BEGIN
    -- Check if it is a fresh publication or an update to an existing published chapter
    IF (NEW.status = 'published') THEN
        IF (OLD IS NULL OR OLD.status != 'published') THEN
            notif_type := 'new_chapter';
        ELSE
            -- Treat significant changes in title/content as an update notification
            IF (NEW.title != OLD.title OR NEW.content != OLD.content) THEN
                notif_type := 'chapter_update';
            ELSE
                RETURN NEW; -- No significant change
            END IF;
        END IF;

        INSERT INTO notifications (recipient_id, actor_id, type, story_id, chapter_id)
        SELECT 
            f.follower_id, 
            NEW.author_id, 
            notif_type, 
            NEW.story_id, 
            NEW.id
        FROM follows f
        WHERE f.following_id = NEW.author_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_published
    AFTER INSERT OR UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION notify_on_chapter_published();

-- Trigger for New Followers
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_follower
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Trigger for Story Likes
CREATE OR REPLACE FUNCTION notify_on_story_like()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, actor_id, type, story_id)
    SELECT 
        s.author_id, 
        NEW.user_id, 
        'story_like', 
        NEW.story_id
    FROM stories s
    WHERE s.id = NEW.story_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_story_liked
    AFTER INSERT ON story_likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_story_like();
-- MIGRATION: 2026-04-14 - Fix Notification Upsert Fingerprint
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS fingerprint TEXT UNIQUE;

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

-- ENABLE REALTIME for Notifications
-- This allows the app to listen for live inserts/updates
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
