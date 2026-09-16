-- Fix RLS for all tables to allow anon full access (since app has no auth)

-- Modules
drop policy if exists "Allow auth full access to modules" on modules;
drop policy if exists "Allow public read access to modules" on modules;
create policy "Allow public all access to modules" on modules for all to anon, authenticated using (true) with check (true);

-- Team Members
drop policy if exists "Allow auth full access to team_members" on team_members;
drop policy if exists "Allow public read access to team_members" on team_members;
create policy "Allow public all access to team_members" on team_members for all to anon, authenticated using (true) with check (true);

-- Attendance
drop policy if exists "Allow auth full access to attendance" on attendance;
drop policy if exists "Allow public read access to attendance" on attendance;
drop policy if exists "Allow public insert to attendance" on attendance;
drop policy if exists "Allow public update to attendance" on attendance;
create policy "Allow public all access to attendance" on attendance for all to anon, authenticated using (true) with check (true);

-- Absence Reasons
drop policy if exists "Allow auth full access to absence_reasons" on absence_reasons;
drop policy if exists "Allow public read access to absence_reasons" on absence_reasons;
create policy "Allow public all access to absence_reasons" on absence_reasons for all to anon, authenticated using (true) with check (true);
