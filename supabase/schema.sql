-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Modules Table
create table modules (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    responsible_leader text,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);

-- Team Members Table
create table team_members (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    epf text not null,
    gender text check (gender in ('Male', 'Female')),
    role text check (role in ('Team Member', 'Group Leader', 'Mender', 'Team Leader', 'Indirect')),
    module_id uuid references modules(id) on delete cascade,
    created_at timestamp with time zone default now()
);

-- Absence Reasons Table
create table absence_reasons (
    id uuid primary key default gen_random_uuid(),
    category text not null check (category in ('Planning leave', 'Inform leave', 'Not inform leave', 'Dutypay', 'Half day')),
    reason_text text not null,
    created_at timestamp with time zone default now()
);

-- Attendance Table
create table attendance (
    id uuid primary key default gen_random_uuid(),
    date date not null default current_date,
    module_id uuid references modules(id) on delete cascade,
    member_id uuid references team_members(id) on delete cascade,
    status text not null check (status in ('Present', 'Absent')),
    category text,
    reason_id uuid references absence_reasons(id),
    created_at timestamp with time zone default now(),
    unique(date, member_id)
);

-- Insert initial absence reasons
insert into absence_reasons (category, reason_text) values 
('Inform leave', 'Sick'),
('Inform leave', 'Personal'),
('Inform leave', 'Wedding'),
('Inform leave', 'Funeral'),
('Inform leave', 'Chickenpox'),
('Inform leave', 'Conjunctivitis'),
('Inform leave', 'Paternity'),
('Not inform leave', 'Not inform'),
('Planning leave', 'Sunday work'),
('Inform leave', 'Flood');

-- RLS (Row Level Security) - For simplicity, we can enable it but allow all operations for now, 
-- or we can secure the admin parts later.
-- For a real production app, we would restrict INSERT/UPDATE on modules/members/reasons to authenticated admin users,
-- and allow INSERT/UPDATE on attendance to anyone (since Team Leaders don't login).
-- Let's set up basic open policies for the public routes, and auth required for admin later if needed.

alter table modules enable row level security;
alter table team_members enable row level security;
alter table absence_reasons enable row level security;
alter table attendance enable row level security;

-- Allow anonymous read access to necessary tables
create policy "Allow public read access to modules" on modules for select to anon, authenticated using (true);
create policy "Allow public read access to team_members" on team_members for select to anon, authenticated using (true);
create policy "Allow public read access to absence_reasons" on absence_reasons for select to anon, authenticated using (true);
create policy "Allow public read access to attendance" on attendance for select to anon, authenticated using (true);

-- Allow anonymous insert/update to attendance table (since Team Leaders don't login)
create policy "Allow public insert to attendance" on attendance for insert to anon, authenticated with check (true);
create policy "Allow public update to attendance" on attendance for update to anon, authenticated using (true);

-- Allow authenticated users (Admin) full access
create policy "Allow auth full access to modules" on modules for all to authenticated using (true);
create policy "Allow auth full access to team_members" on team_members for all to authenticated using (true);
create policy "Allow auth full access to absence_reasons" on absence_reasons for all to authenticated using (true);
create policy "Allow auth full access to attendance" on attendance for all to authenticated using (true);
