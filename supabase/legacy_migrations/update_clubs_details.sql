-- Add extended detail columns to clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS vision text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS mission text[];
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS ambassadors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS core_committee jsonb DEFAULT '[]'::jsonb;

-- Update existing clubs with extended details
-- Match by club name to update the right records

-- 1. Update Codester
UPDATE public.clubs
SET 
    vision = 'To cultivate a vibrant coding culture that empowers students to become innovative problem solvers and proficient programmers, equipping them with the skills necessary to thrive in the ever-evolving technology landscape.',
    mission = ARRAY[
        'To provide a collaborative platform where students can enhance their coding skills through workshops, hackathons, and coding competitions.',
        'To foster an environment that encourages creativity and teamwork, enabling participants to work on diverse projects and share knowledge.',
        'To prepare students for successful careers in technology by offering mentorship, resources, and opportunities for real-world application of coding skills.',
        'To promote continuous learning and exploration of new programming languages, tools, and technologies, ensuring participants stay updated with industry trends.'
    ],
    ambassadors = '[
        {"name": "Mohammed Ahsan Raza Noori", "role": "Associate Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    core_committee = '[
        {"name": "Ashwin Jauhary", "role": "PRESIDENT", "details": "PSITCHE-BCA-II-B | 24116002159"},
        {"name": "Smita Gupta", "role": "VICE-PRESIDENT", "details": "PSITCHE-BCA-II-G | 24116002499"},
        {"name": "Kartik Bajpei", "role": "CLUB REPRESENTATIVE", "details": "PSITCHE-BCA-II-D | 24116002271"},
        {"name": "Krati Gupta", "role": "SECRETARY", "details": "PSITCHE-BCA-II-H | 24116002282"},
        {"name": "Atharva Sharma", "role": "TECHNICAL HEAD", "details": "PSITCHE-BCA-II-B | 24116002161"},
        {"name": "Siddhant Deep", "role": "CREATIVE HEAD", "details": "PSITCHE-BCA-II-G | 24116002494"},
        {"name": "Subhi Sharma", "role": "CONTENT DEVELOPER", "details": "PSITCHE-BCA-II-G | 24116002509"},
        {"name": "Naitik", "role": "SOCIAL MEDIA HEAD", "details": "PSITCHE-BCA-II-D | 24116002322"}
    ]'::jsonb
WHERE name ILIKE '%Codester%' OR name ILIKE '%Coding Club%';

-- 2. Update Logix
UPDATE public.clubs
SET 
    vision = 'LOGIX-The Technical Club.',
    mission = ARRAY['LOGIX-The Technical Club.'],
    ambassadors = '[
        {"name": "Poonam Singh", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    core_committee = '[
        {"name": "Prashansa Patkar", "role": "PRESIDENT", "details": "PSITCHE-BCA-III-A | 23071002451"},
        {"name": "Pranvendra Pratap Singh", "role": "VICE-PRESIDENT", "details": "PSITCHE-BCA-III-F | 23071002450"},
        {"name": "Ansh Yadav", "role": "CLUB REPRESENTATIVE", "details": "PSITCHE-BCA-II-B | 24116002114"},
        {"name": "Enos Emanuel", "role": "SECRETARY", "details": "PSITCHE-BCA-III-A | 23071002318"},
        {"name": "Arpit Bajpai", "role": "TECHNICAL HEAD", "details": "PSITCHE-BCA-II-B | 24116002142"},
        {"name": "Pragati Pandey", "role": "CREATIVE HEAD", "details": "PSITCHE-BCA-III-F | 23071002442"},
        {"name": "Aman Kariya", "role": "CONTENT DEVELOPER", "details": "PSITCHE-BCA-II-A | 24116002087"}
    ]'::jsonb
WHERE name ILIKE '%Logix%' OR name ILIKE '%Technical Club%';

-- 3. Update Stellar
UPDATE public.clubs
SET 
    vision = '"To inspire and equip future HR leaders by fostering practical skills, innovative thinking, and ethical decision-making through immersive learning experiences."',
    mission = ARRAY['"Our mission is to provide a dynamic platform for students to explore, understand, and apply the principles of human resource management."'],
    ambassadors = '[
        {"name": "Rashmi Shrivastava", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    core_committee = '[
        {"name": "Aadya Sharma", "role": "PRESIDENT", "details": "PSITCHE-BBA-II-A | 24015002055"},
        {"name": "Anushka Bhatt", "role": "VICE-PRESIDENT", "details": "PSITCHE-BBA-II-B | 24015002149"}
    ]'::jsonb
WHERE name ILIKE '%Stellar%' OR name ILIKE '%Human Resource%';

-- 4. Update Prayas
UPDATE public.clubs
SET 
    vision = 'To create a responsible community that respects the environment and makes conscious efforts for environmental protection and conservation.',
    mission = ARRAY['To work together as a cohesive unit to spread environmental awareness and work towards nurturing a responsible attitude amongst students towards their immediate environment.'],
    ambassadors = '[
        {"name": "Sanjana Kini Agarwal", "role": "Assistant Professor"},
        {"name": "Sweety Dixit", "role": "Senior Manager - Cultural Affairs"}
    ]'::jsonb,
    core_committee = '[
        {"name": "Agam Kalair", "role": "PRESIDENT", "details": "PSITCHE-BBA-II-H | 24015002089"},
        {"name": "Chitranshi Chaudhary", "role": "VICE-PRESIDENT", "details": "PSITCHE-BBA-II-H | 24015002229"},
        {"name": "Gauri Trivedi", "role": "SECRETARY", "details": "PSITCHE-BBA-II-C | 24015002257"},
        {"name": "Krrish Menghani", "role": "TECHNICAL HEAD", "details": "PSITCHE-BBA-II-D | 24015002318"},
        {"name": "Krati Mishra", "role": "SOCIAL MEDIA HEAD", "details": "PSITCHE-BBA-II-D | 24015002314"}
    ]'::jsonb
WHERE name ILIKE '%Prayas%' OR name ILIKE '%Eco Club%';

-- Verify updates
SELECT name, vision IS NOT NULL as has_vision, mission IS NOT NULL as has_mission, 
       jsonb_array_length(ambassadors) as ambassador_count,
       jsonb_array_length(core_committee) as committee_count
FROM public.clubs
WHERE name ILIKE '%Codester%' OR name ILIKE '%Logix%' OR name ILIKE '%Stellar%' OR name ILIKE '%Prayas%';
