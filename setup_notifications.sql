-- Function to notify when an event is created or status changes
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
        IF (NEW.status = 'approved') THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (NEW.created_by, 'Event Approved', 'Your event "' || NEW.title || '" has been approved!', 'success');
        ELSIF (NEW.status = 'rejected') THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (NEW.created_by, 'Event Rejected', 'Your event "' || NEW.title || '" was rejected.', 'error');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Events
DROP TRIGGER IF EXISTS on_event_change ON public.events;
CREATE TRIGGER on_event_change
    AFTER INSERT OR UPDATE ON public.events
    FOR EACH ROW EXECUTE PROCEDURE public.handle_event_notification();


-- Function to notify when club application status changes
CREATE OR REPLACE FUNCTION public.handle_app_notification()
RETURNS TRIGGER AS $$
DECLARE
    club_name text;
BEGIN
    SELECT name INTO club_name FROM public.clubs WHERE id = NEW.club_id;

    IF (OLD.status <> NEW.status) THEN
        IF (NEW.status = 'approved') THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (NEW.user_id, 'Application Accepted', 'You have been accepted into ' || club_name || '!', 'success');
        ELSIF (NEW.status = 'rejected') THEN
             INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (NEW.user_id, 'Application Status', 'Your application to ' || club_name || ' was updated to ' || NEW.status, 'info');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Applications
DROP TRIGGER IF EXISTS on_application_change ON public.club_applications;
CREATE TRIGGER on_application_change
    AFTER UPDATE ON public.club_applications
    FOR EACH ROW EXECUTE PROCEDURE public.handle_app_notification();
