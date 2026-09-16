-- Drop old role constraint and add new one with all roles
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
  CHECK (role in ('Team Member', 'Group Leader', 'Mender', 'Team Leader', 'Indirect', 'N/A', 'AM', 'DGM', 'Executive', 'Senior Executive'));
