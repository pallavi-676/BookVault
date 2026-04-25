-- 📩 MESSAGING RPC: get_inbox_threads
-- Run this in your Supabase SQL Editor to enable the Messaging Inbox.

DROP FUNCTION IF EXISTS get_inbox_threads(uuid);

CREATE OR REPLACE FUNCTION get_inbox_threads(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    content TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    other_user_id UUID,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        -- Find the last message date for each partner
        SELECT 
            CASE 
                WHEN m.sender_id = user_uuid THEN m.recipient_id 
                ELSE m.sender_id 
            END AS partner_id,
            MAX(m.created_at) as last_msg_at
        FROM messages m
        WHERE m.sender_id = user_uuid OR m.recipient_id = user_uuid
        GROUP BY 1
    )
    SELECT 
        m.id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.is_read,
        m.created_at,
        c.partner_id as other_user_id,
        p.full_name,
        p.username,
        p.avatar_url
    FROM conversations c
    JOIN messages m ON (
        (m.sender_id = user_uuid AND m.recipient_id = c.partner_id) OR
        (m.sender_id = c.partner_id AND m.recipient_id = user_uuid)
    ) AND m.created_at = c.last_msg_at
    JOIN profiles p ON p.id = c.partner_id
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
