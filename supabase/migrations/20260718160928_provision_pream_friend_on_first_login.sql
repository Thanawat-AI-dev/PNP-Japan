-- Let the friend (Pream) log in via magic link and use the app immediately,
-- with no manual admin setup. Profiles are not auto-created on signup, so
-- without this a first-time login lands on the "no account - contact admin"
-- screen. This trigger provisions Pream the moment their auth user is created:
-- it creates their profile (role 'friend', shown in the UI as "หมวย") and links
-- them as the KKP account's beneficiary.
--
-- Locked to Pream's exact email so no one else who happens to sign up can be
-- turned into the account's friend, and guarded on a still-empty beneficiary
-- slot so it only ever provisions once.

create or replace function public.provision_pream_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) <> 'preamnontachaporn@gmail.com' then
    return new;
  end if;

  -- Profile (id must match the auth user). Ignore if it somehow already exists.
  insert into public.profiles (id, display_name, role)
  values (new.id, 'Pream', 'friend')
  on conflict (id) do nothing;

  -- Attach as the KKP account's beneficiary, only while the slot is still empty.
  update public.accounts
  set beneficiary_id = new.id
  where id = '9bcb6fe5-4a18-4a20-99a5-db8606f668b6'
    and beneficiary_id is null;

  return new;
end;
$$;

-- Internal-only: fired by the trigger, never called directly.
revoke execute on function public.provision_pream_on_signup() from public, anon, authenticated;

drop trigger if exists provision_pream_on_signup on auth.users;
create trigger provision_pream_on_signup
  after insert on auth.users
  for each row
  execute function public.provision_pream_on_signup();
