-- The init migration's trailing table-level `revoke insert, update` also revoked the column-level
-- UPDATE grants on profiles and groups, so users could not save settings or rename groups.
grant update (display_name, locale, bible_version_id, theme) on public.profiles to authenticated;
grant update (name) on public.groups to authenticated;
