DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Drop all check constraints on team_members
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'team_members'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE team_members DROP CONSTRAINT ' || quote_ident(rec.conname);
    END LOOP;
END $$;

-- Add new constraints that allow 'N/A'
ALTER TABLE team_members ADD CONSTRAINT team_members_gender_check CHECK (gender in ('Male', 'Female', 'N/A'));
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role in ('Team Member', 'Group Leader', 'Mender', 'Team Leader', 'Indirect', 'N/A'));
