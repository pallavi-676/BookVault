CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'follow', 'like_story', 'like_chapter', 'comment', 'reply'
    story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Prevent duplicate notifications for some types (e.g., following the same person)
    CONSTRAINT unique_notification UNIQUE (recipient_id, actor_id, type, story_id, chapter_id, comment_id)
);

-- Index for fast fetching of unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = recipient_id);

CREATE POLICY "System/Users can insert notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications (mark as read)" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
