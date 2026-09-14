create table if not exists system_settings (
  id integer primary key default 1,
  manual_cadre integer
);
insert into system_settings (id, manual_cadre) values (1, 0) on conflict (id) do nothing;
alter table system_settings enable row level security;
create policy ""Allow public read access to system_settings"" on system_settings for select to anon, authenticated using (true);
create policy ""Allow auth full access to system_settings"" on system_settings for all to authenticated using (true);
create policy ""Allow public update to system_settings"" on system_settings for update to anon, authenticated using (true);
