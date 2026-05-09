-- =============================================================================
-- Maison & Co. -- safer create_studio_for_owner
--
-- Replaces the v1 function which took p_user_id (allowed any UUID -- bug).
-- New version reads auth.uid() internally, is idempotent, and falls back to
-- "<user_name>'s Studio" if no name is provided.
-- =============================================================================

drop function if exists public.create_studio_for_owner(uuid, text, text);

create or replace function public.create_studio_for_owner(
  p_studio_name text default null
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id   uuid := auth.uid();
  v_studio_id uuid;
  v_existing  uuid;
  v_name      text;
  v_user_name text;
  v_slug      text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Idempotency: if this user already owns an active studio, just return it.
  select sm.studio_id into v_existing
  from public.studio_members sm
  where sm.user_id = v_user_id
    and sm.role = 'owner'
    and sm.status = 'active'
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  -- Studio name fallback: "<user name>'s Studio".
  if p_studio_name is null or btrim(p_studio_name) = '' then
    select name into v_user_name from public.users where id = v_user_id;
    v_name := coalesce(v_user_name, 'My') || '''s Studio';
  else
    v_name := btrim(p_studio_name);
  end if;

  -- Slug: lowercase + dashes + random suffix to keep uniqueness.
  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(md5(random()::text), 1, 6);
  v_slug := btrim(v_slug, '-');

  insert into public.studios (name, slug, owner_id)
  values (v_name, v_slug, v_user_id)
  returning id into v_studio_id;

  insert into public.studio_members (studio_id, user_id, role, status)
  values (v_studio_id, v_user_id, 'owner', 'active');

  insert into public.studio_subscriptions (studio_id, plan, status, trial_ends_at)
  values (v_studio_id, 'free', 'trialing', now() + interval '14 days');

  return v_studio_id;
end;
$$;

-- Allow authenticated users to call it.
grant execute on function public.create_studio_for_owner(text) to authenticated;
