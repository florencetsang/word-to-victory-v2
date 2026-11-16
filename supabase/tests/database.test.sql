begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- Fixtures -------------------------------------------------------------------------------------
create function pg_temp.login(u uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@example.com', '{}');

select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Alice', 'profile from metadata');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000b'), 'bob', 'profile from email');
select is((select count(*)::int from reading_records where user_id is not null), 3, 'personal records created');

create temp table ids as select
  (select id from reading_records where user_id = '00000000-0000-0000-0000-00000000000a') as alice_rec,
  (select id from reading_records where user_id = '00000000-0000-0000-0000-00000000000b') as bob_rec;
grant select on ids to authenticated;

-- Personal record ------------------------------------------------------------------------------
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ insert into chapter_reads (record_id, book_code, chapter) select alice_rec, 'GEN', 1 from ids $$, 'mark own chapter');
select throws_ok($$ insert into chapter_reads (record_id, book_code, chapter) select alice_rec, 'GEN', 51 from ids $$, '22023', null, 'reject invalid chapter');
select throws_ok($$ insert into chapter_reads (record_id, book_code, chapter) select bob_rec, 'GEN', 1 from ids $$, '42501', null, 'cannot mark others');
select is((select read_by from chapter_reads where book_code = 'GEN'), '00000000-0000-0000-0000-00000000000a'::uuid, 'attribution set');
select is((select count(*)::int from reading_events where action = 'read'), 1, 'event logged');
select is((select jsonb_array_length(record_reads(alice_rec)) from ids), 1, 'record_reads returns progress');
select is((select sum(chapters)::int from record_activity((select alice_rec from ids), 'UTC')), 1, 'activity aggregated');
select is((select import_chapters(alice_rec, '[["EXO",1],["EXO",2],["GEN",1]]') from ids), 2, 'import skips duplicates');
select is((select count(*)::int from reading_events), 1, 'import does not log events');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from chapter_reads), 0, 'bob cannot read alice progress');
select is((select count(*)::int from profiles), 1, 'bob sees only himself');
select throws_ok($$ select reset_record(alice_rec) from ids $$, '42501', null, 'bob cannot reset alice');
select lives_ok($$ update profiles set theme = 'light', locale = 'en' where id = '00000000-0000-0000-0000-00000000000b' $$, 'update own settings');
select is((select theme from profiles where id = '00000000-0000-0000-0000-00000000000b'), 'light', 'settings saved');
select throws_ok($$ update profiles set id = gen_random_uuid() where id = '00000000-0000-0000-0000-00000000000b' $$, '42501', null, 'protected profile column');

-- Sharing --------------------------------------------------------------------------------------
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ select share_with_email('BOB@example.com') $$, 'share with bob by email');
select throws_ok($$ select share_with_email('nobody@example.com') $$, 'P0002', null, 'unknown email');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from chapter_reads), 3, 'bob reads shared record');
select throws_ok($$ insert into chapter_reads (record_id, book_code, chapter) select alice_rec, 'GEN', 2 from ids $$, '42501', null, 'shared is read-only');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Alice', 'bob sees sharer profile');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
create temp table tok as select create_public_link() as t;
grant select on tok to anon, authenticated;
select is(create_public_link(), (select t from tok), 'public link is stable');
select pg_temp.logout();
set local role anon;
select is((select jsonb_array_length(get_public_record((select t from tok)) -> 'reads')), 3, 'anon reads public record');
select is(get_public_record('nope'), null, 'bad token returns nothing');
select throws_ok($$ select record_reads(gen_random_uuid()) $$, '42501', null, 'anon cannot call private rpcs');
reset role;

-- Groups ---------------------------------------------------------------------------------------
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
create temp table g as select create_group('Shared', 'shared') as shared_id, create_group('Solo', 'individual') as indiv_id;
grant select on g to authenticated;
select is((select count(*)::int from reading_records where group_id is not null), 1, 'shared group has a record');

select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from groups), 0, 'non-member sees no groups');
select throws_ok($$ select join_group('BADCODE1') $$, 'P0002', null, 'invalid invite code');
select pg_temp.logout();
create temp table codes as select (select invite_code from groups where id = shared_id) as shared_code,
  (select invite_code from groups where id = indiv_id) as indiv_code from g;
grant select on codes to authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select name from group_preview((select lower(shared_code) from codes))), 'Shared', 'preview by code (case-insensitive)');
select lives_ok($$ select join_group((select shared_code from codes)) $$, 'carol joins');
select lives_ok($$ select join_group((select indiv_code from codes)) $$, 'carol joins individual group');
select lives_ok($$ insert into chapter_reads (record_id, book_code, chapter)
  select r.id, 'MAT', 1 from reading_records r join g on r.group_id = g.shared_id $$, 'member marks shared record');
select is((select count(*)::int from chapter_reads c join ids on c.record_id = ids.alice_rec), 3,
  'individual group exposes co-member personal record');
select is((select chapters_read from group_progress((select shared_id from g)) where user_id = '00000000-0000-0000-0000-00000000000c'), 1,
  'shared group attribution');
select throws_ok($$ select regenerate_invite((select shared_id from g)) $$, '42501', null, 'member cannot regenerate');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ update groups set name = 'Renamed' where id = (select shared_id from g) $$, 'owner renames group');
select lives_ok($$ select remove_member((select shared_id from g), '00000000-0000-0000-0000-00000000000c') $$, 'owner removes member');

select * from finish();
rollback;
