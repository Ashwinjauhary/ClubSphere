-- 1. Setup Table Schema (Add missing columns for extended details)
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS vision text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS mission text[];
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS ambassadors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS core_committee jsonb DEFAULT '[]'::jsonb;

-- 2. Seed Data
-- We use a temporary function or DO block to set variables if needed, but direct INSERT is easier.
-- We'll try to use the current user as admin, or fallback to the first user found.

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
-- 1. Codester
(
    'Codester - Coding Club',
    'codester-club',
    'CODESTER is more than just a coding club—it is a dynamic hub of innovation, problem-solving, and technological advancement at PSITCHE. Managed by the Department of Computer Applications, the club provides students a structured environment to explore and enhance their programming skills.\n\nThe club CODESTER Offers:\na. Workshops & Hackathons\nb. Project Development & Collaboration\nc. Expert Guidance & Mentorship\nd. Competitive Programming Culture\ne. Networking & Career Opportunities',
    'Technology',
    2024,
    '/logo_codester.png',
    '',
    'To cultivate a vibrant coding culture that empowers students to become innovative problem solvers and proficient programmers, equipping them with the skills necessary to thrive in the ever-evolving technology landscape.',
    ARRAY[
        'To provide a collaborative platform where students can enhance their coding skills through workshops, hackathons, and coding competitions.',
        'To foster an environment that encourages creativity and teamwork, enabling participants to work on diverse projects and share knowledge.',
        'To prepare students for successful careers in technology by offering mentorship, resources, and opportunities for real-world application of coding skills.',
        'To promote continuous learning and exploration of new programming languages, tools, and technologies, ensuring participants stay updated with industry trends.'
    ],
    '[
        {"name": "Mohammed Ahsan Raza Noori", "role": "Associate Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    '[
        {"name": "Ashwin Jauhary", "role": "PRESIDENT", "details": "PSITCHE-BCA-II-B | 24116002159"},
        {"name": "Smita Gupta", "role": "VICE-PRESIDENT", "details": "PSITCHE-BCA-II-G | 24116002499"},
        {"name": "Kartik Bajpei", "role": "CLUB REPRESENTATIVE", "details": "PSITCHE-BCA-II-D | 24116002271"},
        {"name": "Krati Gupta", "role": "SECRETARY", "details": "PSITCHE-BCA-II-H | 24116002282"},
        {"name": "Atharva Sharma", "role": "TECHNICAL HEAD", "details": "PSITCHE-BCA-II-B | 24116002161"},
        {"name": "Siddhant Deep", "role": "CREATIVE HEAD", "details": "PSITCHE-BCA-II-G | 24116002494"},
        {"name": "Subhi Sharma", "role": "CONTENT DEVELOPER", "details": "PSITCHE-BCA-II-G | 24116002509"},
        {"name": "Naitik", "role": "SOCIAL MEDIA HEAD", "details": "PSITCHE-BCA-II-D | 24116002322"}
    ]'::jsonb,
    (SELECT id FROM admin_user),
    NOW()
),
-- 2. Logix
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
-- 3. Stellar
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
-- 4. Prayas
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    vision = EXCLUDED.vision,
    mission = EXCLUDED.mission,
    ambassadors = EXCLUDED.ambassadors,
    core_committee = EXCLUDED.core_committee,
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url;

