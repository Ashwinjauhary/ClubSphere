-- Restore deleted clubs with all details
-- Using a CTE to get the first available user as admin

WITH admin_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO public.clubs (
    name, 
    slug, 
    description, 
    category, 
    founded_year, 
    logo_url, 
    banner_url, 
    vision, 
    mission, 
    ambassadors, 
    core_committee, 
    admin_id,
    created_at
)
VALUES 
-- 1. Logix
(
    'The Logix - Technical Club',
    'logix-technical',
    'LOGIX-The Technical Club is a hub for logic, reasoning, and cutting-edge technical problem solving.',
    'Technical',
    2017,
    '/clubs/logix-technical/logo/logo.png',
    '/clubs/logix-technical/events/banner.png',
    'LOGIX-The Technical Club.',
    ARRAY['LOGIX-The Technical Club.'],
    '[
        {"name": "Poonam Singh", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    '[
        {"name": "Prashansa Patkar", "role": "PRESIDENT", "details": "PSITCHE-BCA-III-A | 23071002451"},
        {"name": "Pranvendra Pratap Singh", "role": "VICE-PRESIDENT", "details": "PSITCHE-BCA-III-F | 23071002450"},
        {"name": "Ansh Yadav", "role": "CLUB REPRESENTATIVE", "details": "PSITCHE-BCA-II-B | 24116002114"},
        {"name": "Enos Emanuel", "role": "SECRETARY", "details": "PSITCHE-BCA-III-A | 23071002318"},
        {"name": "Arpit Bajpai", "role": "TECHNICAL HEAD", "details": "PSITCHE-BCA-II-B | 24116002142"},
        {"name": "Pragati Pandey", "role": "CREATIVE HEAD", "details": "PSITCHE-BCA-III-F | 23071002442"},
        {"name": "Aman Kariya", "role": "CONTENT DEVELOPER", "details": "PSITCHE-BCA-II-A | 24116002087"}
    ]'::jsonb,
    (SELECT id FROM admin_user),
    NOW()
),
-- 2. Stellar
(
    'The Stellar - Human Resource Club',
    'stellar-hr',
    '"Stellar" symbolizes excellence and brilliance in the field of Human Resource Management. Stellar Club is a student-driven HR forum that serves as an interactive platform for aspiring HR professionals to develop essential people management skills, leadership abilities, and a deep understanding of organizational dynamics.',
    'Business',
    2020,
    '/clubs/stellar-hr/logo/logo.png',
    '/clubs/stellar-hr/events/banner.png',
    '"To inspire and equip future HR leaders by fostering practical skills, innovative thinking, and ethical decision-making through immersive learning experiences."',
    ARRAY['"Our mission is to provide a dynamic platform for students to explore, understand, and apply the principles of human resource management."'],
    '[
        {"name": "Rashmi Shrivastava", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    '[
        {"name": "Aadya Sharma", "role": "PRESIDENT", "details": "PSITCHE-BBA-II-A | 24015002055"},
        {"name": "Anushka Bhatt", "role": "VICE-PRESIDENT", "details": "PSITCHE-BBA-II-B | 24015002149"}
    ]'::jsonb,
    (SELECT id FROM admin_user),
    NOW()
),
-- 3. Prayas
(
    'The Prayas - The Eco Club',
    'prayas-eco',
    'Incessant exploitation of our natural resources has shown some alarming results in recent times. This Eco Club has been created to contribute towards a cleaner and greener society that is environmentally aware and responsible.',
    'Community',
    2016,
    '/clubs/prayas-eco/logo/logo.png',
    '/clubs/prayas-eco/events/banner.png',
    'To create a responsible community that respects the environment and makes conscious efforts for environmental protection and conservation.',
    ARRAY['To work together as a cohesive unit to spread environmental awareness and work towards nurturing a responsible attitude amongst students towards their immediate environment.'],
    '[
        {"name": "Sanjana Kini Agarwal", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    '[
        {"name": "Agam Kalair", "role": "PRESIDENT", "details": "PSITCHE-BBA-II-H | 24015002089"},
        {"name": "Chitranshi Chaudhary", "role": "VICE-PRESIDENT", "details": "PSITCHE-BBA-II-H | 24015002229"},
        {"name": "Gauri Trivedi", "role": "SECRETARY", "details": "PSITCHE-BBA-II-C | 24015002257"},
        {"name": "Krrish Menghani", "role": "TECHNICAL HEAD", "details": "PSITCHE-BBA-II-D | 24015002318"},
        {"name": "Krati Mishra", "role": "SOCIAL MEDIA HEAD", "details": "PSITCHE-BBA-II-D | 24015002314"}
    ]'::jsonb,
    (SELECT id FROM admin_user),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Verify restoration
SELECT name, slug, vision IS NOT NULL as has_details FROM public.clubs
WHERE slug IN ('logix-technical', 'stellar-hr', 'prayas-eco');
