-- 📚 BOOKVAULT MASTER STABILIZATION SQL
-- Apply these to your Supabase SQL Editor to finalize social infrastructure.

-- 1. THEME PERSISTENCE
-- Ensure the profiles table supports theme preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- 2. MESSAGING INBOX RPC
-- This RPC groups messages by conversation partner for a clean inbox view.
DROP FUNCTION IF EXISTS get_inbox_threads(uuid);
CREATE OR REPLACE FUNCTION get_inbox_threads(current_user_id UUID)
RETURNS TABLE (
    partner_id UUID,
    partner_full_name TEXT,
    partner_username TEXT,
    partner_avatar_url TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH partner_ids AS (
        -- Select distinct partners we've talked to
        SELECT 
            CASE 
                WHEN sender_id = current_user_id THEN receiver_id 
                ELSE sender_id 
            END as p_id,
            MAX(created_at) as last_ts
        FROM messages
        WHERE sender_id = current_user_id OR receiver_id = current_user_id
        GROUP BY 1
    )
    SELECT 
        p.p_id as partner_id,
        pr.full_name as partner_full_name,
        pr.username as partner_username,
        pr.avatar_url as partner_avatar_url,
        m.content as last_message,
        m.created_at as last_message_at,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.sender_id = p.p_id 
         AND m2.receiver_id = current_user_id 
         AND m2.is_read = false) as unread_count
    FROM partner_ids p
    JOIN profiles pr ON pr.id = p.p_id
    JOIN messages m ON (
        (m.sender_id = current_user_id AND m.receiver_id = p.p_id) OR
        (m.sender_id = p.p_id AND m.receiver_id = current_user_id)
    ) AND m.created_at = p.last_ts
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FOLLOWERS COUNT TRIGGERS
-- Ensure counts stay synced automatically when following/unfollowing
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.author_id;
        UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.reader_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.author_id;
        UPDATE profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.reader_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 4. CLEANUP ON ACCOUNT DELETION
-- Ensure profiles are removed correctly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);
