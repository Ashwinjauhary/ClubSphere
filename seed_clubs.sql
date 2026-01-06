-- CLEANUP EXISTING CLUBS (Optional, comment out if you want to keep existing)
-- delete from public.clubs;

-- INSERT CLUBS
INSERT INTO public.clubs (name, slug, category, description, founded_year) VALUES
('The Bastion - The English Club', 'bastion-english', 'Literary', 'Fostering a love for the English language and literature through debates, poetry, and creative writing.', 2018),
('The Codester - Coding Club', 'codester-coding', 'Technical', 'A community for developers, hackers, and tech enthusiasts to build, learn, and innovate.', 2019),
('The Energy Club', 'energy-club', 'Technical', 'Promoting sustainable energy solutions and innovations in power systems.', 2020),
('The Finverse - Finance Club', 'finverse-finance', 'Business', 'Exploring the world of finance, stock markets, and economics.', 2021),
('The IKS Club', 'iks-club', 'Cultural', 'Indian Knowledge Systems - preserving and promoting ancient Indian wisdom and heritage.', 2022),
('The Ingenious - Photography Club', 'ingenious-photography', 'Creative', 'Capturing moments and mastering the art of visual storytelling.', 2018),
('The Logix - Technical Club', 'logix-technical', 'Technical', 'Focusing on logic, reasoning, and cutting-edge technical problem solving.', 2017),
('The MarketMaze - Marketing Club', 'marketmaze-marketing', 'Business', 'Unraveling the strategies behind successful brands and marketing campaigns.', 2019),
('The Navrang - Cultural Club', 'navrang-cultural', 'Cultural', 'Celebrating diversity through dance, drama, and artistic expression.', 2015),
('The NSS - Social Service Club', 'nss-social-service', 'Community', 'National Service Scheme - Dedicated to community service and social welfare.', 2010),
('The Prayas - The Eco Club', 'prayas-eco', 'Community', 'Striving for a greener planet through environmental awareness and action.', 2016),
('The Stellar - Human Resource Club', 'stellar-hr', 'Business', 'Developing leadership and people management skills for future HR professionals.', 2020),
('The Synergy - Value Education Cell', 'synergy-values', 'Community', 'Inculcating moral values and ethics for holistic character development.', 2018),
('The Yoga - Meditation and Wellness Club', 'yoga-wellness', 'Wellness', 'Promoting physical and mental well-being through yoga and meditation practices.', 2015)
ON CONFLICT (slug) DO NOTHING;

-- Optional: You can manually update admin_id for specific clubs if you have user UUIDs
-- UPDATE public.clubs SET admin_id = 'USER_UUID_HERE' WHERE slug = 'codester-coding';
