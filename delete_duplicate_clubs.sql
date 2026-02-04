-- Delete duplicate clubs that were inserted by seed_clubs.sql
-- These will have slugs matching the static data

DELETE FROM public.clubs
WHERE slug IN (
    'codester-club',
    'logix-technical', 
    'stellar-hr',
    'prayas-eco'
);

-- Verify deletion
SELECT COUNT(*) as remaining_clubs FROM public.clubs;
