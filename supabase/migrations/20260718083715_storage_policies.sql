-- Storage RLS for the `slips` bucket (spec section 5 "เก็บไฟล์สลิป").
--
-- Path convention the app must use when uploading: `<account_id>/<filename>`.
-- storage.foldername(name) splits the object path into an array of folder
-- segments, so foldername(name)[1] is the account_id folder.
--
-- No UPDATE policy: slips are never overwritten, only ever newly inserted,
-- so INSERT + SELECT is enough (see Supabase security checklist note on
-- storage upsert needing INSERT+SELECT+UPDATE - that's only for the upsert
-- case, which we don't use).

create policy "account members upload slips" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'slips'
    and is_account_member((storage.foldername(name))[1]::uuid)
  );

create policy "account members read slips" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'slips'
    and is_account_member((storage.foldername(name))[1]::uuid)
  );
