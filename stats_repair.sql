-- 🛡️ ULTIMATE STATS REPAIR 🛡️
-- This script synchronizes all counters for every user to ensure UI accuracy.

-- 1. Sync Followers Count
UPDATE public.profiles p
SET followers_count = (
    SELECT count(*) 
    FROM public.follows f 
    WHERE f.following_id = p.id
);

-- 2. Sync Following Count
UPDATE public.profiles p
SET following_count = (
    SELECT count(*) 
    FROM public.follows f 
    WHERE f.follower_id = p.id
);

-- 3. Sync Stories Count
UPDATE public.profiles p
SET stories_count = (
    SELECT count(*) 
    FROM public.stories s 
    WHERE s.author_id = p.id AND s.visibility = 'published'
);

-- 4. Re-Initialize Triggers for future accuracy
CREATE OR REPLACE FUNCTION update_follower_counts_robust()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts_robust();
