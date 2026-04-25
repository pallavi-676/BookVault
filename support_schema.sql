-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a support ticket (public access for pre-login support)
CREATE POLICY "Enable public inserts for support tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (true);

-- Policy: Only service role or specialized admins can read (Manual management in Supabase Dashboard)
CREATE POLICY "Admins can view support tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() IN (SELECT id FROM profiles WHERE username = 'admin')); -- Adjust as needed
