-- TVS Jurisdiction Seed Data
-- All 50 US States + Territories + Example Counties

-- ============================================
-- FEDERAL (Level 0)
-- ============================================
INSERT INTO jurisdictions (id, parent_id, name, type, code, full_path, level) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'United States', 'federal', 'US', 'United States', 0);

-- ============================================
-- STATES (Level 1) - All 50 States + DC + Territories
-- ============================================
INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level) VALUES
  -- States (alphabetical)
  ('00000000-0000-0000-0000-000000000001', 'Alabama', 'state', 'US-AL', 'United States > Alabama', 1),
  ('00000000-0000-0000-0000-000000000001', 'Alaska', 'state', 'US-AK', 'United States > Alaska', 1),
  ('00000000-0000-0000-0000-000000000001', 'Arizona', 'state', 'US-AZ', 'United States > Arizona', 1),
  ('00000000-0000-0000-0000-000000000001', 'Arkansas', 'state', 'US-AR', 'United States > Arkansas', 1),
  ('00000000-0000-0000-0000-000000000001', 'California', 'state', 'US-CA', 'United States > California', 1),
  ('00000000-0000-0000-0000-000000000001', 'Colorado', 'state', 'US-CO', 'United States > Colorado', 1),
  ('00000000-0000-0000-0000-000000000001', 'Connecticut', 'state', 'US-CT', 'United States > Connecticut', 1),
  ('00000000-0000-0000-0000-000000000001', 'Delaware', 'state', 'US-DE', 'United States > Delaware', 1),
  ('00000000-0000-0000-0000-000000000001', 'Florida', 'state', 'US-FL', 'United States > Florida', 1),
  ('00000000-0000-0000-0000-000000000001', 'Georgia', 'state', 'US-GA', 'United States > Georgia', 1),
  ('00000000-0000-0000-0000-000000000001', 'Hawaii', 'state', 'US-HI', 'United States > Hawaii', 1),
  ('00000000-0000-0000-0000-000000000001', 'Idaho', 'state', 'US-ID', 'United States > Idaho', 1),
  ('00000000-0000-0000-0000-000000000001', 'Illinois', 'state', 'US-IL', 'United States > Illinois', 1),
  ('00000000-0000-0000-0000-000000000001', 'Indiana', 'state', 'US-IN', 'United States > Indiana', 1),
  ('00000000-0000-0000-0000-000000000001', 'Iowa', 'state', 'US-IA', 'United States > Iowa', 1),
  ('00000000-0000-0000-0000-000000000001', 'Kansas', 'state', 'US-KS', 'United States > Kansas', 1),
  ('00000000-0000-0000-0000-000000000001', 'Kentucky', 'state', 'US-KY', 'United States > Kentucky', 1),
  ('00000000-0000-0000-0000-000000000001', 'Louisiana', 'state', 'US-LA', 'United States > Louisiana', 1),
  ('00000000-0000-0000-0000-000000000001', 'Maine', 'state', 'US-ME', 'United States > Maine', 1),
  ('00000000-0000-0000-0000-000000000001', 'Maryland', 'state', 'US-MD', 'United States > Maryland', 1),
  ('00000000-0000-0000-0000-000000000001', 'Massachusetts', 'state', 'US-MA', 'United States > Massachusetts', 1),
  ('00000000-0000-0000-0000-000000000001', 'Michigan', 'state', 'US-MI', 'United States > Michigan', 1),
  ('00000000-0000-0000-0000-000000000001', 'Minnesota', 'state', 'US-MN', 'United States > Minnesota', 1),
  ('00000000-0000-0000-0000-000000000001', 'Mississippi', 'state', 'US-MS', 'United States > Mississippi', 1),
  ('00000000-0000-0000-0000-000000000001', 'Missouri', 'state', 'US-MO', 'United States > Missouri', 1),
  ('00000000-0000-0000-0000-000000000001', 'Montana', 'state', 'US-MT', 'United States > Montana', 1),
  ('00000000-0000-0000-0000-000000000001', 'Nebraska', 'state', 'US-NE', 'United States > Nebraska', 1),
  ('00000000-0000-0000-0000-000000000001', 'Nevada', 'state', 'US-NV', 'United States > Nevada', 1),
  ('00000000-0000-0000-0000-000000000001', 'New Hampshire', 'state', 'US-NH', 'United States > New Hampshire', 1),
  ('00000000-0000-0000-0000-000000000001', 'New Jersey', 'state', 'US-NJ', 'United States > New Jersey', 1),
  ('00000000-0000-0000-0000-000000000001', 'New Mexico', 'state', 'US-NM', 'United States > New Mexico', 1),
  ('00000000-0000-0000-0000-000000000001', 'New York', 'state', 'US-NY', 'United States > New York', 1),
  ('00000000-0000-0000-0000-000000000001', 'North Carolina', 'state', 'US-NC', 'United States > North Carolina', 1),
  ('00000000-0000-0000-0000-000000000001', 'North Dakota', 'state', 'US-ND', 'United States > North Dakota', 1),
  ('00000000-0000-0000-0000-000000000001', 'Ohio', 'state', 'US-OH', 'United States > Ohio', 1),
  ('00000000-0000-0000-0000-000000000001', 'Oklahoma', 'state', 'US-OK', 'United States > Oklahoma', 1),
  ('00000000-0000-0000-0000-000000000001', 'Oregon', 'state', 'US-OR', 'United States > Oregon', 1),
  ('00000000-0000-0000-0000-000000000001', 'Pennsylvania', 'state', 'US-PA', 'United States > Pennsylvania', 1),
  ('00000000-0000-0000-0000-000000000001', 'Rhode Island', 'state', 'US-RI', 'United States > Rhode Island', 1),
  ('00000000-0000-0000-0000-000000000001', 'South Carolina', 'state', 'US-SC', 'United States > South Carolina', 1),
  ('00000000-0000-0000-0000-000000000001', 'South Dakota', 'state', 'US-SD', 'United States > South Dakota', 1),
  ('00000000-0000-0000-0000-000000000001', 'Tennessee', 'state', 'US-TN', 'United States > Tennessee', 1),
  ('00000000-0000-0000-0000-000000000001', 'Texas', 'state', 'US-TX', 'United States > Texas', 1),
  ('00000000-0000-0000-0000-000000000001', 'Utah', 'state', 'US-UT', 'United States > Utah', 1),
  ('00000000-0000-0000-0000-000000000001', 'Vermont', 'state', 'US-VT', 'United States > Vermont', 1),
  ('00000000-0000-0000-0000-000000000001', 'Virginia', 'state', 'US-VA', 'United States > Virginia', 1),
  ('00000000-0000-0000-0000-000000000001', 'Washington', 'state', 'US-WA', 'United States > Washington', 1),
  ('00000000-0000-0000-0000-000000000001', 'West Virginia', 'state', 'US-WV', 'United States > West Virginia', 1),
  ('00000000-0000-0000-0000-000000000001', 'Wisconsin', 'state', 'US-WI', 'United States > Wisconsin', 1),
  ('00000000-0000-0000-0000-000000000001', 'Wyoming', 'state', 'US-WY', 'United States > Wyoming', 1),

  -- District of Columbia
  ('00000000-0000-0000-0000-000000000001', 'District of Columbia', 'state', 'US-DC', 'United States > District of Columbia', 1),

  -- Territories
  ('00000000-0000-0000-0000-000000000001', 'Puerto Rico', 'state', 'US-PR', 'United States > Puerto Rico', 1),
  ('00000000-0000-0000-0000-000000000001', 'Guam', 'state', 'US-GU', 'United States > Guam', 1),
  ('00000000-0000-0000-0000-000000000001', 'U.S. Virgin Islands', 'state', 'US-VI', 'United States > U.S. Virgin Islands', 1),
  ('00000000-0000-0000-0000-000000000001', 'American Samoa', 'state', 'US-AS', 'United States > American Samoa', 1),
  ('00000000-0000-0000-0000-000000000001', 'Northern Mariana Islands', 'state', 'US-MP', 'United States > Northern Mariana Islands', 1);

-- ============================================
-- EXAMPLE COUNTIES (Level 2) - California Counties
-- ============================================

-- First, get California's ID (we'll use a subquery)
-- For seeding, we'll insert with explicit references

-- Placer County (the example from user's request)
INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Placer County', 'county', 'US-CA-PLACER', 'United States > California > Placer County', 2
FROM jurisdictions WHERE code = 'US-CA';

-- A few more California counties for testing
INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Sacramento County', 'county', 'US-CA-SACRAMENTO', 'United States > California > Sacramento County', 2
FROM jurisdictions WHERE code = 'US-CA';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Los Angeles County', 'county', 'US-CA-LA', 'United States > California > Los Angeles County', 2
FROM jurisdictions WHERE code = 'US-CA';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'San Francisco County', 'county', 'US-CA-SF', 'United States > California > San Francisco County', 2
FROM jurisdictions WHERE code = 'US-CA';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'San Diego County', 'county', 'US-CA-SD', 'United States > California > San Diego County', 2
FROM jurisdictions WHERE code = 'US-CA';

-- ============================================
-- EXAMPLE CITIES (Level 3) - Placer County Cities
-- ============================================
INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Auburn', 'city', 'US-CA-PLACER-AUBURN', 'United States > California > Placer County > Auburn', 3
FROM jurisdictions WHERE code = 'US-CA-PLACER';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Roseville', 'city', 'US-CA-PLACER-ROSEVILLE', 'United States > California > Placer County > Roseville', 3
FROM jurisdictions WHERE code = 'US-CA-PLACER';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Rocklin', 'city', 'US-CA-PLACER-ROCKLIN', 'United States > California > Placer County > Rocklin', 3
FROM jurisdictions WHERE code = 'US-CA-PLACER';

INSERT INTO jurisdictions (parent_id, name, type, code, full_path, level)
SELECT id, 'Lincoln', 'city', 'US-CA-PLACER-LINCOLN', 'United States > California > Placer County > Lincoln', 3
FROM jurisdictions WHERE code = 'US-CA-PLACER';

-- ============================================
-- VERIFY HIERARCHY
-- ============================================
-- Run this to verify the hierarchy:
-- SELECT code, name, type, level, full_path FROM jurisdictions ORDER BY level, code;

-- Test jurisdiction chain for Placer County:
-- SELECT * FROM get_jurisdiction_chain((SELECT id FROM jurisdictions WHERE code = 'US-CA-PLACER'));
-- Should return: United States (0), California (1), Placer County (2)
