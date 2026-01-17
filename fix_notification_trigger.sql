-- Fix Notification Trigger
-- The original trigger fails if an event has no 'created_by' user (e.g. test data).
-- This update adds a check to ensure 'created_by' is not NULL before creating a notification.

CREATE OR REPLACE FUNCTION public.handle_event_notification()
RETURNS TRIGGER AS $$
DECLARE
    club_name text;
    dean_id uuid;
BEGIN
    -- Get Club Name
    SELECT name INTO club_name FROM public.clubs WHERE id = NEW.club_id;

    -- 1. New Event Proposed (Pending) -> Notify all Deans
    IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
        FOR dean_id IN SELECT id FROM public.profiles WHERE role = 'dean' LOOP
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (dean_id, 'New Event Proposal', 'Club ' || club_name || ' has proposed: ' || NEW.title, 'info');
        END LOOP;
    END IF;

    -- 2. Event Status Changed -> Notify Creator (Club Admin)
    IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
        -- Only notify if there IS a creator to notify
        IF (NEW.created_by IS NOT NULL) THEN
            IF (NEW.status = 'approved') THEN
                INSERT INTO public.notifications (user_id, title, message, type)
                VALUES (NEW.created_by, 'Event Approved', 'Your event "' || NEW.title || '" has been approved!', 'success');
            ELSIF (NEW.status = 'rejected') THEN
                INSERT INTO public.notifications (user_id, title, message, type)
                VALUES (NEW.created_by, 'Event Rejected', 'Your event "' || NEW.title || '" was rejected.', 'error');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
