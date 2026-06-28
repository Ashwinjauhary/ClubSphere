-- Event Registration System
-- Allows students to register for events

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can register themselves
CREATE POLICY "Students can register for events"
    ON event_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Students can view their own registrations
CREATE POLICY "Users can view their own registrations"
    ON event_registrations FOR SELECT
    USING (auth.uid() = user_id);

-- Students can cancel their own registrations
CREATE POLICY "Users can cancel their registrations"
    ON event_registrations FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can view registrations for their club's events
CREATE POLICY "Admins can view their club event registrations"
    ON event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN clubs c ON e.club_id = c.id
            WHERE e.id = event_registrations.event_id
            AND c.admin_id = auth.uid()
        )
    );

-- Admins can update registration status (mark attendance)
CREATE POLICY "Admins can update registration status"
    ON event_registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN clubs c ON e.club_id = c.id
            WHERE e.id = event_registrations.event_id
            AND c.admin_id = auth.uid()
        )
    );

-- Dean can view all registrations
CREATE POLICY "Dean can view all registrations"
    ON event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'dean'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;

COMMENT ON TABLE event_registrations IS 'Stores student registrations for events';
COMMENT ON COLUMN event_registrations.status IS 'Registration status: registered, attended, cancelled';
