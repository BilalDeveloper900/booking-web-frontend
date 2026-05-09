-- =============================================================================
-- Maison & Co. -- seed data for local dev
-- Re-runnable: clears public data first, then inserts fresh seed.
-- DOES NOT touch auth.users -- that's owned by Supabase Auth.
-- =============================================================================

-- Wipe existing seed (in dependency order). Skips during first-ever run.
truncate table
  public.reviews,
  public.messages,
  public.thread_participants,
  public.threads,
  public.payouts,
  public.studio_subscriptions,
  public.payments,
  public.credit_transactions,
  public.client_credits,
  public.client_subscriptions,
  public.credit_packs,
  public.subscription_plans,
  public.bookings,
  public.sessions,
  public.recurring_class_templates,
  public.availability_exceptions,
  public.availability_rules,
  public.studio_hours,
  public.services,
  public.studio_members,
  public.studios,
  public.users
restart identity cascade;


-- Stable UUIDs so we can reference them across runs.
do $$
declare
  v_studio        uuid := '11111111-1111-1111-1111-111111111111';
  v_owner         uuid := '22222222-2222-2222-2222-222222222222';   -- Elena
  v_admin         uuid := '33333333-3333-3333-3333-333333333333';   -- Camille
  v_admin2        uuid := '44444444-4444-4444-4444-444444444444';   -- Yuki
  v_client        uuid := '55555555-5555-5555-5555-555555555555';   -- Olivia
  v_owner_member  uuid;
  v_admin_member  uuid;
  v_admin2_member uuid;
  v_client_member uuid;
  v_plan_studio   uuid;
begin
  -- Users (mirror what the auth trigger would create; emails must match real
  -- auth.users when wired up).
  insert into public.users (id, email, name, avatar_hue) values
    (v_owner,  'elena@maisonandco.test',   'Elena Marchetti', 195),
    (v_admin,  'camille@maisonandco.test', 'Camille Roux',    195),
    (v_admin2, 'yuki@maisonandco.test',    'Yuki Tanaka',     165),
    (v_client, 'olivia@maisonandco.test',  'Olivia Wren',     195);

  -- Studio
  insert into public.studios (id, name, slug, owner_id, country, timezone, currency)
  values (v_studio, 'Maison and Co.', 'maison-and-co', v_owner, 'FR', 'Europe/Paris', 'EUR');

  -- Memberships
  insert into public.studio_members (id, studio_id, user_id, role, status, specialty, commission_pct)
  values (gen_random_uuid(), v_studio, v_owner, 'owner', 'active', null, null)
  returning id into v_owner_member;

  insert into public.studio_members (id, studio_id, user_id, role, status, specialty, commission_pct)
  values (gen_random_uuid(), v_studio, v_admin, 'admin', 'active', 'Senior Colorist', 65)
  returning id into v_admin_member;

  insert into public.studio_members (id, studio_id, user_id, role, status, specialty, commission_pct)
  values (gen_random_uuid(), v_studio, v_admin2, 'admin', 'active', 'Yoga Teacher', 70)
  returning id into v_admin2_member;

  insert into public.studio_members (id, studio_id, user_id, role, status, joined_at, member_since)
  values (gen_random_uuid(), v_studio, v_client, 'client', 'active', now() - interval '120 days', now() - interval '120 days')
  returning id into v_client_member;

  -- Studio hours: open Tue-Sat, closed Sun/Mon
  insert into public.studio_hours (studio_id, weekday, open_time, close_time, closed) values
    (v_studio, 0, null, null, true),
    (v_studio, 1, null, null, true),
    (v_studio, 2, '09:00', '19:00', false),
    (v_studio, 3, '09:00', '19:00', false),
    (v_studio, 4, '09:00', '19:00', false),
    (v_studio, 5, '09:00', '19:00', false),
    (v_studio, 6, '10:00', '17:00', false);

  -- Camille's working hours: Tue-Sat 10:00-18:00 (Sat ends at 16)
  insert into public.availability_rules (studio_id, admin_member_id, weekday, start_time, end_time) values
    (v_studio, v_admin_member, 2, '10:00', '18:00'),
    (v_studio, v_admin_member, 3, '10:00', '18:00'),
    (v_studio, v_admin_member, 4, '10:00', '18:00'),
    (v_studio, v_admin_member, 5, '10:00', '18:00'),
    (v_studio, v_admin_member, 6, '10:00', '16:00');

  -- Yuki teaches mornings + evenings on Mon/Wed/Fri
  insert into public.availability_rules (studio_id, admin_member_id, weekday, start_time, end_time) values
    (v_studio, v_admin2_member, 1, '07:00', '11:00'),
    (v_studio, v_admin2_member, 1, '17:00', '20:00'),
    (v_studio, v_admin2_member, 3, '07:00', '11:00'),
    (v_studio, v_admin2_member, 3, '17:00', '20:00'),
    (v_studio, v_admin2_member, 5, '07:00', '11:00');

  -- Camille on vacation
  insert into public.availability_exceptions (studio_id, admin_member_id, date, type, reason)
  values
    (v_studio, v_admin_member, '2026-05-05', 'block', 'Vacation'),
    (v_studio, v_admin_member, '2026-05-06', 'block', 'Vacation'),
    (v_studio, v_admin_member, '2026-05-07', 'block', 'Vacation');

  -- Services -- solo (Camille) + group (Yuki)
  insert into public.services (studio_id, admin_member_id, name, description, mode, default_capacity, duration_min, credits_cost, gross_price_cents, hue, active) values
    (v_studio, v_admin_member,  'Cut + gloss',         'Cut, wash, gloss treatment',         'solo',  1, 60, 2, 12000, 195, true),
    (v_studio, v_admin_member,  'Balayage',            'Hand-painted highlights, full head', 'solo',  1, 90, 4, 28000, 195, true),
    (v_studio, v_admin_member,  'Color refresh',       'Root touch-up + gloss',              'solo',  1, 90, 2, 18000, 195, true),
    (v_studio, v_admin2_member, 'Yoga Flow',           'All-levels vinyasa flow',            'group', 12, 60, 1,  1500, 165, true),
    (v_studio, v_admin2_member, 'Mindful Meditation',  'Guided breathwork',                  'group', 20, 30, 1,  1000, 165, true);

  -- Subscription plans (offers builder catalog)
  insert into public.subscription_plans (studio_id, name, description, price_cents, credits_granted, features, sort_order, active) values
    (v_studio, 'Pay-as-you-go', 'Buy credits when you need them', 0,     0,
      jsonb_build_array('No commitment', '12 EUR per credit', 'Book anytime'), 0, true),
    (v_studio, 'Studio',        'For regular salon visits',      8900,  8,
      jsonb_build_array('8 credits/month', 'Priority booking', 'Free reschedule'), 1, true),
    (v_studio, 'Atelier',       'For the dedicated client',      14900, 12,
      jsonb_build_array('12 credits/month', 'Priority + VIP', 'Free reschedule', 'Exclusive events'), 2, true);

  select id into v_plan_studio from public.subscription_plans where studio_id = v_studio and name = 'Studio';

  -- Credit packs
  insert into public.credit_packs (studio_id, credits, price_cents, label, sort_order, active) values
    (v_studio,  5,  5500, '',           0, true),
    (v_studio, 10,  9900, 'Popular',    1, true),
    (v_studio, 20, 17900, 'Best value', 2, true),
    (v_studio, 50, 39900, 'Pro',        3, true);

  -- Olivia's subscription + initial credit balance
  insert into public.client_subscriptions (member_id, plan_id, status, current_period_start, current_period_end)
  values (v_client_member, v_plan_studio, 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month');

  insert into public.credit_transactions (member_id, delta, type, description) values
    (v_client_member, 8,  'monthly_grant', 'Monthly Studio plan credits'),
    (v_client_member, -2, 'spend',         'Cut + gloss with Camille R.');

  -- Studio's own SaaS subscription (Maison and Co. trial)
  insert into public.studio_subscriptions (studio_id, plan, status, trial_ends_at, current_period_end)
  values (v_studio, 'studio', 'trialing', now() + interval '14 days', now() + interval '14 days');

  -- One thread between Olivia and Camille with a few messages
  insert into public.threads (id, studio_id, last_message_at)
  values ('66666666-6666-6666-6666-666666666666', v_studio, now() - interval '2 minutes');

  insert into public.thread_participants (thread_id, member_id) values
    ('66666666-6666-6666-6666-666666666666', v_client_member),
    ('66666666-6666-6666-6666-666666666666', v_admin_member);

  insert into public.messages (thread_id, sender_member_id, body, created_at) values
    ('66666666-6666-6666-6666-666666666666', v_client_member, 'Hi Camille! Any availability for a balayage touch-up?',  now() - interval '20 minutes'),
    ('66666666-6666-6666-6666-666666666666', v_admin_member,  'Hey Olivia! Thursday at 2 PM works. Want me to book it?', now() - interval '15 minutes'),
    ('66666666-6666-6666-6666-666666666666', v_client_member, 'Perfect, yes please.',                                    now() - interval '2 minutes');
end $$;
