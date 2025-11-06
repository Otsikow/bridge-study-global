-- Function to check if a username is available during signup.
-- Uses SECURITY DEFINER so anonymous clients can safely invoke it
-- without exposing the full profiles table via RLS exemptions.

create or replace function public.is_username_available(candidate text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
  username_taken boolean;
begin
  if candidate is null then
    return false;
  end if;

  normalized_username := lower(regexp_replace(candidate, '[^a-z0-9_]', '', 'g'));

  if length(normalized_username) < 3 then
    return false;
  end if;

  select exists (
    select 1
    from public.profiles p
    where lower(p.username) = normalized_username
  )
  into username_taken;

  return not coalesce(username_taken, false);
end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon;
grant execute on function public.is_username_available(text) to authenticated;
grant execute on function public.is_username_available(text) to service_role;
