-- RLS policies for missing tables

-- badge_definitions (read-only for authenticated)
drop policy if exists "badge_definitions_read" on public.badge_definitions;
create policy "badge_definitions_read" on public.badge_definitions
for select to authenticated using (true);

drop policy if exists "badge_definitions_service" on public.badge_definitions;
create policy "badge_definitions_service" on public.badge_definitions
for all to service_role using (true) with check (true);

-- permissions (read-only for authenticated)
drop policy if exists "permissions_read" on public.permissions;
create policy "permissions_read" on public.permissions
for select to authenticated using (true);

drop policy if exists "permissions_service" on public.permissions;
create policy "permissions_service" on public.permissions
for all to service_role using (true) with check (true);

-- role_permissions (read-only for authenticated)
drop policy if exists "role_permissions_read" on public.role_permissions;
create policy "role_permissions_read" on public.role_permissions
for select to authenticated using (true);

drop policy if exists "role_permissions_service" on public.role_permissions;
create policy "role_permissions_service" on public.role_permissions
for all to service_role using (true) with check (true);

-- challenge_participants (org-scoped)
drop policy if exists "challenge_participants_select" on public.challenge_participants;
create policy "challenge_participants_select" on public.challenge_participants
for select to authenticated using (
  challenge_id in (
    select id from public.challenges
    where organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  )
);

drop policy if exists "challenge_participants_insert" on public.challenge_participants;
create policy "challenge_participants_insert" on public.challenge_participants
for insert to authenticated with check (
  challenge_id in (
    select id from public.challenges
    where organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  )
);

drop policy if exists "challenge_participants_update" on public.challenge_participants;
create policy "challenge_participants_update" on public.challenge_participants
for update to authenticated using (
  challenge_id in (
    select id from public.challenges
    where organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  )
);

-- rate_limit_tracking (service role only)
drop policy if exists "rate_limit_service" on public.rate_limit_tracking;
create policy "rate_limit_service" on public.rate_limit_tracking
for all to service_role using (true) with check (true);

-- webhook_deliveries (admins read; service role write)
drop policy if exists "webhook_deliveries_read" on public.webhook_deliveries;
create policy "webhook_deliveries_read" on public.webhook_deliveries
for select to authenticated using (
  webhook_id in (
    select id from public.webhooks
    where organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  )
);

drop policy if exists "webhook_deliveries_service" on public.webhook_deliveries;
create policy "webhook_deliveries_service" on public.webhook_deliveries
for all to service_role using (true) with check (true);
