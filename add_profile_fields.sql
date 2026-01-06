-- Add role-specific profile fields
-- Students: roll_number, branch, year, section
-- Dean/Admin: employee_id, department, designation, office_location

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_location TEXT;

-- Add helpful comments
COMMENT ON COLUMN profiles.roll_number IS 'Student roll number (e.g., 2101330100123)';
COMMENT ON COLUMN profiles.branch IS 'Student branch (CSE, IT, ME, etc.)';
COMMENT ON COLUMN profiles.year IS 'Student year (1st, 2nd, 3rd, 4th)';
COMMENT ON COLUMN profiles.section IS 'Student section (A, B, C, etc.)';
COMMENT ON COLUMN profiles.employee_id IS 'Employee ID for Dean/Admin';
COMMENT ON COLUMN profiles.department IS 'Department for Dean/Admin';
COMMENT ON COLUMN profiles.designation IS 'Designation (Dean, HOD, Admin Officer)';
COMMENT ON COLUMN profiles.office_location IS 'Office location for Dean';

