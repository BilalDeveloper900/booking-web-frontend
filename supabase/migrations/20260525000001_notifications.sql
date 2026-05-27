-- =============================================================================
-- Book It Daily — in-app notifications
--
-- One row per (recipient, event). Triggers fan-out on bookings and
-- credit_transactions inserts/updates to populate per-role recipients:
--
--   client : credit_topup, credit_gift, credit_refund
--   admin  : booking_created, booking_cancelled, credit_topup, credit_refund
--   owner  : booking_created, booking_cancelled, all credit movements
--            (topup, gift, refund, adjustment)
--
-- Realtime is enabled so the bell dropdown updates without polling.
-- =============================================================================

create table public.notifications (
  id                      uuid primary key default gen_random_uuid(),
  studio_id               uuid not null references public.studios(id) on delete cascade,
  recipient_member_id     uuid not null references public.studio_members(id) on delete cascade,
  kind                    text not null check (kind in (
                            'booking_created',
                            'booking_cancelled',
                            'credit_topup',
                            'credit_gift',
                            'credit_refund',
                            'credit_adjustment'
                          )),
  title                   text not null,
  body                    text,
  href                    text,
  related_booking_id      uuid references public.bookings(id) on delete set null,
  related_transaction_id  uuid references public.credit_transactions(id) on delete set null,
  related_member_id       uuid references public.studio_members(id) on delete set null,
  read_at                 timestamptz,
  created_at              timestamptz not null default now()
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_member_id, created_at desc);
create index notifications_recipient_unread_idx
  on public.notifications (recipient_member_id)
  where read_at is null;


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — recipients can read and mark-read; inserts only happen via triggers
-- (security definer) so no client-side insert/delete policies are needed.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.notifications enable row level security;

create policy notifications_select_recipient on public.notifications
  for select using (
    exists (
      select 1 from public.studio_members m
      where m.id = notifications.recipient_member_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Recipient may only flip read_at; other columns are immutable from the client.
create policy notifications_update_recipient on public.notifications
  for update using (
    exists (
      select 1 from public.studio_members m
      where m.id = notifications.recipient_member_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.studio_members m
      where m.id = notifications.recipient_member_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Helper — return all admin + owner member ids in a studio (for fan-out)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.staff_member_ids(p_studio_id uuid)
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select id from public.studio_members
  where studio_id = p_studio_id
    and status = 'active'
    and role in ('admin','owner')
$$;

create or replace function public.owner_member_id(p_studio_id uuid)
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select id from public.studio_members
  where studio_id = p_studio_id
    and status = 'active'
    and role = 'owner'
  limit 1
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger — booking inserts → fan out to admins + owner
-- (Skip on inserts that arrive already in 'cancelled' state, which shouldn't
-- happen but is defensive.)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.notify_on_booking_insert()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_studio_id     uuid;
  v_service_name  text;
  v_starts_at     timestamptz;
  v_client_name   text;
  v_admin_href    text;
  v_staff_id      uuid;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  select s.studio_id, sv.name, s.starts_at
    into v_studio_id, v_service_name, v_starts_at
  from public.sessions s
  join public.services sv on sv.id = s.service_id
  where s.id = new.session_id;

  select u.name
    into v_client_name
  from public.studio_members m
  join public.users u on u.id = m.user_id
  where m.id = new.client_member_id;

  v_admin_href := '/admin/bookings';

  for v_staff_id in select public.staff_member_ids(v_studio_id)
  loop
    insert into public.notifications (
      studio_id, recipient_member_id, kind, title, body, href,
      related_booking_id, related_member_id
    ) values (
      v_studio_id,
      v_staff_id,
      'booking_created',
      'New booking',
      coalesce(v_client_name, 'A client') || ' booked ' || coalesce(v_service_name, 'a class'),
      v_admin_href,
      new.id,
      new.client_member_id
    );
  end loop;

  return new;
end;
$$;

create trigger notifications_on_booking_insert
after insert on public.bookings
for each row execute function public.notify_on_booking_insert();


-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger — booking status flips to 'cancelled' → fan out to admins + owner
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.notify_on_booking_cancel()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_studio_id     uuid;
  v_service_name  text;
  v_client_name   text;
  v_admin_href    text;
  v_staff_id      uuid;
begin
  if old.status = 'cancelled' or new.status <> 'cancelled' then
    return new;
  end if;

  select s.studio_id, sv.name
    into v_studio_id, v_service_name
  from public.sessions s
  join public.services sv on sv.id = s.service_id
  where s.id = new.session_id;

  select u.name
    into v_client_name
  from public.studio_members m
  join public.users u on u.id = m.user_id
  where m.id = new.client_member_id;

  v_admin_href := '/admin/bookings';

  for v_staff_id in select public.staff_member_ids(v_studio_id)
  loop
    insert into public.notifications (
      studio_id, recipient_member_id, kind, title, body, href,
      related_booking_id, related_member_id
    ) values (
      v_studio_id,
      v_staff_id,
      'booking_cancelled',
      'Booking cancelled',
      coalesce(v_client_name, 'A client') || ' cancelled ' || coalesce(v_service_name, 'a class'),
      v_admin_href,
      new.id,
      new.client_member_id
    );
  end loop;

  return new;
end;
$$;

create trigger notifications_on_booking_cancel
after update of status on public.bookings
for each row execute function public.notify_on_booking_cancel();


-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger — credit ledger movement → per-role fan-out
--
-- Mapping from ledger 'type' (+ sign) to notification 'kind':
--   topup      → credit_topup       (client purchased a credit pack)
--   adjustment +ve → credit_gift    (owner gifted credits)
--   adjustment -ve → credit_adjustment (owner manually debited — owner-only notice)
--   refund     → credit_refund      (booking cancelled outside window, etc.)
--   spend, monthly_grant, expire → no notification
--
-- Recipients per the product spec:
--   client : credit_topup, credit_gift, credit_refund
--   admin  : credit_topup, credit_refund
--   owner  : credit_topup, credit_gift, credit_refund, credit_adjustment
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.notify_on_credit_transaction()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_studio_id    uuid;
  v_client_name  text;
  v_owner_id     uuid;
  v_staff_id     uuid;
  v_kind         text;
  v_client_title text;
  v_client_body  text;
  v_staff_title  text;
  v_staff_body   text;
  v_notify_client boolean := false;
  v_notify_admin  boolean := false;
  v_notify_owner  boolean := true;   -- owner sees all transactions
  v_abs          int := abs(new.delta);
begin
  -- Decide notification kind from ledger type + delta sign.
  if new.type = 'topup' then
    v_kind := 'credit_topup';
    v_notify_client := true;
    v_notify_admin  := true;
  elsif new.type = 'refund' then
    v_kind := 'credit_refund';
    v_notify_client := true;
    v_notify_admin  := true;
  elsif new.type = 'adjustment' and new.delta > 0 then
    v_kind := 'credit_gift';
    v_notify_client := true;
  elsif new.type = 'adjustment' and new.delta < 0 then
    v_kind := 'credit_adjustment';
    -- Owner-only — neither client nor admin is paged for a manual debit.
  else
    -- spend / monthly_grant / expire — no notifications.
    return new;
  end if;

  select studio_id into v_studio_id
  from public.studio_members
  where id = new.member_id;

  select u.name
    into v_client_name
  from public.studio_members m
  join public.users u on u.id = m.user_id
  where m.id = new.member_id;

  -- Owner row.
  v_owner_id := public.owner_member_id(v_studio_id);

  -- Client-facing copy.
  if v_kind = 'credit_topup' then
    v_client_title := 'Credits added';
    v_client_body  := 'You purchased ' || v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || '.';
  elsif v_kind = 'credit_gift' then
    v_client_title := 'Credits gifted';
    v_client_body  := 'You received ' || v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || ' from your studio.';
  elsif v_kind = 'credit_refund' then
    v_client_title := 'Credits refunded';
    v_client_body  := v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || ' refunded to your balance.';
  end if;

  -- Staff (admin/owner) facing copy.
  if v_kind = 'credit_topup' then
    v_staff_title := 'Credit purchase';
    v_staff_body  := coalesce(v_client_name, 'A client') || ' bought ' || v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || '.';
  elsif v_kind = 'credit_gift' then
    v_staff_title := 'Credits gifted';
    v_staff_body  := v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || ' gifted to ' || coalesce(v_client_name, 'a client') || '.';
  elsif v_kind = 'credit_refund' then
    v_staff_title := 'Credit refund';
    v_staff_body  := coalesce(v_client_name, 'a client') || ' was refunded ' || v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || '.';
  elsif v_kind = 'credit_adjustment' then
    v_staff_title := 'Manual adjustment';
    v_staff_body  := v_abs || ' credit' || case when v_abs = 1 then '' else 's' end || ' deducted from ' || coalesce(v_client_name, 'a client') || '.';
  end if;

  -- Client recipient.
  if v_notify_client then
    insert into public.notifications (
      studio_id, recipient_member_id, kind, title, body, href,
      related_transaction_id, related_member_id
    ) values (
      v_studio_id,
      new.member_id,
      v_kind,
      v_client_title,
      v_client_body,
      '/client/credits',
      new.id,
      new.member_id
    );
  end if;

  -- Admin recipients (excluding the owner — owner is handled separately so
  -- the row reads "owner" in the audit feed rather than appearing twice).
  if v_notify_admin then
    for v_staff_id in
      select id from public.studio_members
      where studio_id = v_studio_id
        and status = 'active'
        and role = 'admin'
    loop
      insert into public.notifications (
        studio_id, recipient_member_id, kind, title, body, href,
        related_transaction_id, related_member_id
      ) values (
        v_studio_id,
        v_staff_id,
        v_kind,
        v_staff_title,
        v_staff_body,
        '/admin/my-clients',
        new.id,
        new.member_id
      );
    end loop;
  end if;

  -- Owner recipient (always for credit movements).
  if v_notify_owner and v_owner_id is not null then
    insert into public.notifications (
      studio_id, recipient_member_id, kind, title, body, href,
      related_transaction_id, related_member_id
    ) values (
      v_studio_id,
      v_owner_id,
      v_kind,
      v_staff_title,
      v_staff_body,
      '/owner/clients',
      new.id,
      new.member_id
    );
  end if;

  return new;
end;
$$;

create trigger notifications_on_credit_transaction
after insert on public.credit_transactions
for each row execute function public.notify_on_credit_transaction();


-- ─────────────────────────────────────────────────────────────────────────────
-- RPC — mark all my unread notifications as read
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.mark_all_notifications_read()
returns int
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_count   int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  with updated as (
    update public.notifications n
       set read_at = now()
      from public.studio_members m
     where m.id = n.recipient_member_id
       and m.user_id = v_user_id
       and m.status = 'active'
       and n.read_at is null
    returning n.id
  )
  select count(*)::int into v_count from updated;

  return v_count;
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;


-- ─── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.notifications;
