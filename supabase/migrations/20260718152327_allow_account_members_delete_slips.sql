-- Let account members delete slip images belonging to their own account,
-- mirroring the existing "account members read/upload slips" policies. Slips are
-- foldered by account id (the first path segment), so membership is checked the
-- same way. This enables removing a wrong/duplicate slip through the Storage API
-- (direct SQL deletion of storage rows is blocked by a Supabase safety trigger).
create policy "account members delete slips"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'slips'
  and public.is_account_member(((storage.foldername(name))[1])::uuid)
);
