-- Tenant admin scope migration for existing CyberCultX Supabase databases.
--
-- Run this in the Supabase SQL Editor after taking a backup.
-- It adds tenant ownership columns needed for "admin" users to administer only
-- their tenant, while "superadmin" remains platform-wide.
--
-- Important: after running this SQL, update the API/Drizzle schema and queries
-- to filter tenant-scoped tables by the current user's tenant_id.

begin;

-- Ensure there is at least one tenant for existing non-superadmin data.
insert into tenants (name, domain, plan, status, employee_count, admin_email, industry, country)
select 'Default Tenant', 'default.local', 'starter', 'active', 0, 'admin@default.local', 'general', 'UAE'
where not exists (select 1 from tenants);

-- Add tenant ownership to tenant-scoped tables.
alter table departments
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table users
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table courses
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table phishing_templates
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table phishing_campaigns
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table report_jobs
  add column if not exists tenant_id integer references tenants(id) on delete restrict;

alter table audit_logs
  add column if not exists tenant_id integer references tenants(id) on delete set null;

-- Backfill users by matching the email domain to tenants.domain when possible.
-- Superadmins are allowed to remain tenantless because they are platform-wide.
with fallback as (
  select id from tenants order by id limit 1
)
update users u
set tenant_id = coalesce(
  (
    select t.id
    from tenants t
    where lower(t.domain) = lower(split_part(u.email, '@', 2))
    order by t.id
    limit 1
  ),
  (select id from fallback)
)
where u.tenant_id is null
  and lower(u.role) <> 'superadmin';

-- Backfill departments to the fallback tenant. Existing departments do not
-- currently carry tenant information, so they cannot be inferred safely.
with fallback as (
  select id from tenants order by id limit 1
)
update departments
set tenant_id = (select id from fallback)
where tenant_id is null;

-- Backfill content and operational records from their creator/user where
-- possible, otherwise use the fallback tenant.
with fallback as (
  select id from tenants order by id limit 1
)
update courses
set tenant_id = (select id from fallback)
where tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update phishing_templates
set tenant_id = (select id from fallback)
where tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update phishing_campaigns pc
set tenant_id = coalesce(u.tenant_id, (select id from fallback))
from users u
where pc.created_by = u.id
  and pc.tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update phishing_campaigns
set tenant_id = (select id from fallback)
where tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update report_jobs r
set tenant_id = coalesce(u.tenant_id, (select id from fallback))
from users u
where r.created_by = u.id
  and r.tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update report_jobs
set tenant_id = (select id from fallback)
where tenant_id is null;

with fallback as (
  select id from tenants order by id limit 1
)
update audit_logs a
set tenant_id = coalesce(u.tenant_id, (select id from fallback))
from users u
where a.user_id = u.id
  and a.tenant_id is null;

-- Enforce tenant ownership where every row should belong to a tenant.
alter table departments
  alter column tenant_id set not null;

alter table courses
  alter column tenant_id set not null;

alter table phishing_templates
  alter column tenant_id set not null;

alter table phishing_campaigns
  alter column tenant_id set not null;

alter table report_jobs
  alter column tenant_id set not null;

-- Non-superadmin users must belong to a tenant. Superadmins may stay global.
alter table users
  drop constraint if exists users_non_superadmin_tenant_required;

alter table users
  add constraint users_non_superadmin_tenant_required
  check (lower(role) = 'superadmin' or tenant_id is not null);

-- Keep department names unique inside each tenant instead of globally.
create unique index if not exists departments_tenant_name_unique
  on departments (tenant_id, lower(name));

-- Helpful indexes for tenant-scoped API filters.
create index if not exists users_tenant_id_idx on users(tenant_id);
create index if not exists users_tenant_role_idx on users(tenant_id, role);
create index if not exists departments_tenant_id_idx on departments(tenant_id);
create index if not exists courses_tenant_id_idx on courses(tenant_id);
create index if not exists phishing_templates_tenant_id_idx on phishing_templates(tenant_id);
create index if not exists phishing_campaigns_tenant_id_idx on phishing_campaigns(tenant_id);
create index if not exists report_jobs_tenant_id_idx on report_jobs(tenant_id);
create index if not exists audit_logs_tenant_id_idx on audit_logs(tenant_id);

-- Keep tenant employee counts roughly accurate after the backfill.
update tenants t
set employee_count = counts.total,
    updated_at = now()
from (
  select tenant_id, count(*)::integer as total
  from users
  where tenant_id is not null
    and lower(role) <> 'superadmin'
  group by tenant_id
) counts
where t.id = counts.tenant_id;

commit;
