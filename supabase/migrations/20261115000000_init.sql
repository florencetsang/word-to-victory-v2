-- Word to Victory: initial schema
-- All authorization lives here (RLS + SECURITY DEFINER RPCs); the SPA talks to PostgREST directly.

------------------------------------------------------------------------------------------------
-- Reference data
------------------------------------------------------------------------------------------------
create table public.bible_books (
  code text primary key,
  ordinal smallint not null unique,
  testament text not null check (testament in ('OT', 'NT')),
  chapters smallint not null check (chapters > 0)
);

insert into public.bible_books (code, ordinal, testament, chapters) values
  ('GEN',1,'OT',50),('EXO',2,'OT',40),('LEV',3,'OT',27),('NUM',4,'OT',36),('DEU',5,'OT',34),
  ('JOS',6,'OT',24),('JDG',7,'OT',21),('RUT',8,'OT',4),('1SA',9,'OT',31),('2SA',10,'OT',24),
  ('1KI',11,'OT',22),('2KI',12,'OT',25),('1CH',13,'OT',29),('2CH',14,'OT',36),('EZR',15,'OT',10),
  ('NEH',16,'OT',13),('EST',17,'OT',10),('JOB',18,'OT',42),('PSA',19,'OT',150),('PRO',20,'OT',31),
  ('ECC',21,'OT',12),('SNG',22,'OT',8),('ISA',23,'OT',66),('JER',24,'OT',52),('LAM',25,'OT',5),
  ('EZK',26,'OT',48),('DAN',27,'OT',12),('HOS',28,'OT',14),('JOL',29,'OT',3),('AMO',30,'OT',9),
  ('OBA',31,'OT',1),('JON',32,'OT',4),('MIC',33,'OT',7),('NAM',34,'OT',3),('HAB',35,'OT',3),
  ('ZEP',36,'OT',3),('HAG',37,'OT',2),('ZEC',38,'OT',14),('MAL',39,'OT',4),
  ('MAT',40,'NT',28),('MRK',41,'NT',16),('LUK',42,'NT',24),('JHN',43,'NT',21),('ACT',44,'NT',28),
  ('ROM',45,'NT',16),('1CO',46,'NT',16),('2CO',47,'NT',13),('GAL',48,'NT',6),('EPH',49,'NT',6),
  ('PHP',50,'NT',4),('COL',51,'NT',4),('1TH',52,'NT',5),('2TH',53,'NT',3),('1TI',54,'NT',6),
  ('2TI',55,'NT',4),('TIT',56,'NT',3),('PHM',57,'NT',1),('HEB',58,'NT',13),('JAS',59,'NT',5),
  ('1PE',60,'NT',5),('2PE',61,'NT',3),('1JN',62,'NT',5),('2JN',63,'NT',1),('3JN',64,'NT',1),
  ('JUD',65,'NT',1),('REV',66,'NT',22);

------------------------------------------------------------------------------------------------
-- Tables
------------------------------------------------------------------------------------------------
create type public.group_mode as enum ('shared', 'individual');
create type public.group_role as enum ('owner', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  locale text not null default 'en' check (locale in ('en', 'zh-Hant')),
  bible_version_id integer not null default 139,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now()
);

create function public.new_invite_code() returns text
language sql volatile set search_path = '' as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
$$;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  mode public.group_mode not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null unique default public.new_invite_code(),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

-- A reading record belongs to exactly one user (personal) or one shared-mode group.
create table public.reading_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  group_id uuid unique references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(user_id, group_id) = 1)
);

create table public.chapter_reads (
  record_id uuid not null references public.reading_records (id) on delete cascade,
  book_code text not null references public.bible_books (code),
  chapter smallint not null,
  read_by uuid references public.profiles (id) on delete set null,
  read_at timestamptz not null default now(),
  primary key (record_id, book_code, chapter)
);

-- Append-only log used for history, heatmap and streaks.
create table public.reading_events (
  id bigint generated always as identity primary key,
  record_id uuid not null references public.reading_records (id) on delete cascade,
  book_code text not null,
  chapter smallint not null,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('read', 'unread')),
  at timestamptz not null default now()
);
create index reading_events_record_at_idx on public.reading_events (record_id, at);

-- Read-only sharing of a record with a specific user, or via a public token.
create table public.record_shares (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.reading_records (id) on delete cascade,
  shared_with_user_id uuid references public.profiles (id) on delete cascade,
  shared_with_email text,
  public_token text unique,
  created_at timestamptz not null default now(),
  check (num_nonnulls(shared_with_user_id, public_token) = 1),
  unique (record_id, shared_with_user_id)
);
create unique index record_shares_one_public_link on public.record_shares (record_id) where public_token is not null;
create index record_shares_recipient_idx on public.record_shares (shared_with_user_id);

create table public.plan_enrollments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.reading_records (id) on delete cascade,
  template_key text,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  books text[] not null check (cardinality(books) > 0),
  days integer not null check (days between 1 and 3650),
  start_date date not null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index plan_enrollments_record_idx on public.plan_enrollments (record_id);

------------------------------------------------------------------------------------------------
-- Triggers
------------------------------------------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80)
  );
  insert into public.reading_records (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.chapter_reads_before_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.bible_books b where b.code = new.book_code and new.chapter between 1 and b.chapters) then
    raise exception 'invalid chapter %.%', new.book_code, new.chapter using errcode = '22023';
  end if;
  -- Attribution and timestamps are server-controlled.
  if auth.uid() is not null then new.read_by := auth.uid(); end if;
  new.read_at := now();
  return new;
end $$;

create trigger chapter_reads_validate before insert on public.chapter_reads
  for each row execute function public.chapter_reads_before_insert();

create function public.chapter_reads_log() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('app.skip_events', true), '') = 'on' then return null; end if;
  if tg_op = 'INSERT' then
    insert into public.reading_events (record_id, book_code, chapter, user_id, action)
    values (new.record_id, new.book_code, new.chapter, auth.uid(), 'read');
  else
    insert into public.reading_events (record_id, book_code, chapter, user_id, action)
    values (old.record_id, old.book_code, old.chapter, auth.uid(), 'unread');
  end if;
  return null;
end $$;

create trigger chapter_reads_log after insert or delete on public.chapter_reads
  for each row execute function public.chapter_reads_log();

create function public.plan_enrollments_validate() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select unnest(new.books) except select code from public.bible_books) then
    raise exception 'invalid book code in plan' using errcode = '22023';
  end if;
  return new;
end $$;

create trigger plan_enrollments_validate before insert or update on public.plan_enrollments
  for each row execute function public.plan_enrollments_validate();

------------------------------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER to avoid recursive RLS)
------------------------------------------------------------------------------------------------
create function public.is_group_member(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid())
$$;

create function public.is_group_owner(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.groups where id = p_group and owner_id = auth.uid())
$$;

create function public.can_write_record(p_record uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.reading_records r
    where r.id = p_record
      and (r.user_id = auth.uid()
           or (r.group_id is not null and exists (
                 select 1 from public.group_members m where m.group_id = r.group_id and m.user_id = auth.uid())))
  )
$$;

-- Readable if writable, explicitly shared with me, or it is the personal record of someone who is in an
-- individual-mode group with me.
create function public.can_read_record(p_record uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.can_write_record(p_record)
    or exists (select 1 from public.record_shares s where s.record_id = p_record and s.shared_with_user_id = auth.uid())
    or exists (
      select 1
      from public.reading_records r
      join public.group_members them on them.user_id = r.user_id
      join public.groups g on g.id = them.group_id and g.mode = 'individual'
      join public.group_members me on me.group_id = g.id and me.user_id = auth.uid()
      where r.id = p_record
    )
$$;

create function public.can_see_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
    or exists (
      select 1 from public.group_members a join public.group_members b on a.group_id = b.group_id
      where a.user_id = auth.uid() and b.user_id = p_user)
    or exists (
      select 1 from public.record_shares s join public.reading_records r on r.id = s.record_id
      where r.user_id = p_user and s.shared_with_user_id = auth.uid())
$$;

------------------------------------------------------------------------------------------------
-- Row-level security
------------------------------------------------------------------------------------------------
alter table public.bible_books enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.reading_records enable row level security;
alter table public.chapter_reads enable row level security;
alter table public.reading_events enable row level security;
alter table public.record_shares enable row level security;
alter table public.plan_enrollments enable row level security;

create policy "books are public" on public.bible_books for select to anon, authenticated using (true);

create policy "see related profiles" on public.profiles for select to authenticated using (public.can_see_profile(id));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members see group" on public.groups for select to authenticated using (public.is_group_member(id));
create policy "owner renames group" on public.groups for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes group" on public.groups for delete to authenticated using (owner_id = auth.uid());

create policy "members see members" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy "member leaves group" on public.group_members for delete to authenticated
  using (user_id = auth.uid() and role = 'member');

create policy "read records" on public.reading_records for select to authenticated using (public.can_read_record(id));

create policy "read chapters" on public.chapter_reads for select to authenticated using (public.can_read_record(record_id));
create policy "mark chapters" on public.chapter_reads for insert to authenticated with check (public.can_write_record(record_id));
create policy "unmark chapters" on public.chapter_reads for delete to authenticated using (public.can_write_record(record_id));

create policy "read events" on public.reading_events for select to authenticated using (public.can_read_record(record_id));

create policy "owner or recipient sees share" on public.record_shares for select to authenticated using (
  shared_with_user_id = auth.uid()
  or exists (select 1 from public.reading_records r where r.id = record_id and r.user_id = auth.uid()));
create policy "owner or recipient removes share" on public.record_shares for delete to authenticated using (
  shared_with_user_id = auth.uid()
  or exists (select 1 from public.reading_records r where r.id = record_id and r.user_id = auth.uid()));

create policy "read plans" on public.plan_enrollments for select to authenticated using (public.can_read_record(record_id));
create policy "add plans" on public.plan_enrollments for insert to authenticated with check (public.can_write_record(record_id));
create policy "edit plans" on public.plan_enrollments for update to authenticated
  using (public.can_write_record(record_id)) with check (public.can_write_record(record_id));
create policy "remove plans" on public.plan_enrollments for delete to authenticated using (public.can_write_record(record_id));

------------------------------------------------------------------------------------------------
-- RPCs
------------------------------------------------------------------------------------------------

-- Compact progress payload: [[book_code, chapter, read_by, read_at], ...]. One row → unaffected by max_rows.
create function public.record_reads(p_record uuid) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_array(c.book_code, c.chapter, c.read_by, c.read_at)), '[]'::jsonb)
  from public.chapter_reads c where c.record_id = p_record
$$;

-- Distinct chapters read per local calendar day.
create function public.record_activity(p_record uuid, p_tz text default 'UTC', p_since date default null)
returns table (day date, chapters integer)
language sql stable set search_path = '' as $$
  select (e.at at time zone p_tz)::date as day, count(distinct (e.book_code, e.chapter))::integer
  from public.reading_events e
  where e.record_id = p_record and e.action = 'read'
    and (p_since is null or (e.at at time zone p_tz)::date >= p_since)
  group by 1 order by 1
$$;

-- Recent activity feed for a record (used for shared groups).
create function public.record_feed(p_record uuid, p_limit integer default 30)
returns table (book_code text, chapter smallint, action text, at timestamptz, user_id uuid, display_name text)
language sql stable set search_path = '' as $$
  select e.book_code, e.chapter, e.action, e.at, e.user_id, p.display_name
  from public.reading_events e left join public.profiles p on p.id = e.user_id
  where e.record_id = p_record
  order by e.at desc, e.id desc
  limit least(greatest(p_limit, 1), 200)
$$;

create function public.import_chapters(p_record uuid, p_chapters jsonb) returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  if not public.can_write_record(p_record) then raise exception 'forbidden' using errcode = '42501'; end if;
  perform set_config('app.skip_events', 'on', true);
  insert into public.chapter_reads (record_id, book_code, chapter)
  select p_record, x ->> 0, (x ->> 1)::smallint from jsonb_array_elements(p_chapters) x
  on conflict do nothing;
  get diagnostics n = row_count;
  perform set_config('app.skip_events', 'off', true);
  return n;
end $$;

create function public.reset_record(p_record uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.reading_records r
    where r.id = p_record and (r.user_id = auth.uid() or public.is_group_owner(r.group_id))
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform set_config('app.skip_events', 'on', true);
  delete from public.chapter_reads where record_id = p_record;
  delete from public.reading_events where record_id = p_record;
  perform set_config('app.skip_events', 'off', true);
end $$;

create function public.create_group(p_name text, p_mode public.group_mode) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  insert into public.groups (name, mode, owner_id) values (btrim(p_name), p_mode, auth.uid()) returning id into g;
  insert into public.group_members (group_id, user_id, role) values (g, auth.uid(), 'owner');
  if p_mode = 'shared' then insert into public.reading_records (group_id) values (g); end if;
  return g;
end $$;

create function public.group_preview(p_code text)
returns table (id uuid, name text, mode public.group_mode, member_count integer, owner_name text, is_member boolean)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name, g.mode,
    (select count(*)::integer from public.group_members m where m.group_id = g.id),
    p.display_name,
    public.is_group_member(g.id)
  from public.groups g join public.profiles p on p.id = g.owner_id
  where g.invite_code = upper(btrim(p_code)) and auth.uid() is not null
$$;

create function public.join_group(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select id into g from public.groups where invite_code = upper(btrim(p_code));
  if g is null then raise exception 'invalid invite code' using errcode = 'P0002'; end if;
  insert into public.group_members (group_id, user_id) values (g, auth.uid()) on conflict do nothing;
  return g;
end $$;

create function public.regenerate_invite(p_group uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if not public.is_group_owner(p_group) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.groups set invite_code = public.new_invite_code() where id = p_group returning invite_code into code;
  return code;
end $$;

create function public.remove_member(p_group uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_group_owner(p_group) then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.group_members where group_id = p_group and user_id = p_user and role = 'member';
end $$;

-- Per-member progress. Individual mode: each member's personal record. Shared mode: chapters each member marked.
create function public.group_progress(p_group uuid)
returns table (user_id uuid, display_name text, role public.group_role, joined_at timestamptz, record_id uuid, chapters_read integer)
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.display_name, m.role, m.joined_at,
    case when g.mode = 'individual' then r.id end,
    case when g.mode = 'individual'
      then (select count(*)::integer from public.chapter_reads c where c.record_id = r.id)
      else (select count(*)::integer from public.chapter_reads c join public.reading_records gr on gr.id = c.record_id
            where gr.group_id = g.id and c.read_by = m.user_id)
    end
  from public.groups g
  join public.group_members m on m.group_id = g.id
  join public.profiles p on p.id = m.user_id
  left join public.reading_records r on r.user_id = m.user_id
  where g.id = p_group and public.is_group_member(p_group)
  order by m.role, m.joined_at
$$;

create function public.share_with_email(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare target uuid; rec uuid; sid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select id into target from auth.users where lower(email) = lower(btrim(p_email));
  if target is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  if target = auth.uid() then raise exception 'cannot share with yourself' using errcode = '22023'; end if;
  select id into rec from public.reading_records where user_id = auth.uid();
  insert into public.record_shares (record_id, shared_with_user_id, shared_with_email)
  values (rec, target, lower(btrim(p_email)))
  on conflict (record_id, shared_with_user_id) do update set shared_with_email = excluded.shared_with_email
  returning id into sid;
  return sid;
end $$;

create function public.create_public_link() returns text
language plpgsql security definer set search_path = '' as $$
declare rec uuid; tok text;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select id into rec from public.reading_records where user_id = auth.uid();
  select public_token into tok from public.record_shares where record_id = rec and public_token is not null;
  if tok is null then
    tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into public.record_shares (record_id, public_token) values (rec, tok);
  end if;
  return tok;
end $$;

-- Anonymous read-only access via public token.
create function public.get_public_record(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'display_name', p.display_name,
    'reads', (select coalesce(jsonb_agg(jsonb_build_array(c.book_code, c.chapter, null, c.read_at)), '[]'::jsonb)
              from public.chapter_reads c where c.record_id = r.id))
  from public.record_shares s
  join public.reading_records r on r.id = s.record_id
  join public.profiles p on p.id = r.user_id
  where s.public_token = p_token and p_token is not null and length(p_token) >= 32
$$;

create function public.delete_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  delete from auth.users where id = auth.uid();
end $$;

------------------------------------------------------------------------------------------------
-- Privileges
------------------------------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.get_public_record(text) to anon;
revoke execute on function public.handle_new_user() from authenticated;

-- Server-controlled columns
revoke insert, update on public.chapter_reads from anon, authenticated;
grant insert (record_id, book_code, chapter) on public.chapter_reads to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (display_name, locale, bible_version_id, theme) on public.profiles to authenticated;
revoke update on public.groups from anon, authenticated;
grant update (name) on public.groups to authenticated;
revoke insert, update on public.reading_events, public.record_shares, public.reading_records, public.groups, public.group_members, public.profiles from anon, authenticated;

------------------------------------------------------------------------------------------------
-- Realtime (live updates for shared group records)
------------------------------------------------------------------------------------------------
alter publication supabase_realtime add table public.chapter_reads;
