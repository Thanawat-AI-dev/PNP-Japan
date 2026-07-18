-- SaveTogether database schema.
-- Copied from savings-tracker-spec.md sections 9 and 10.
-- Run this whole file once in the Supabase SQL Editor when setting up a new project
-- (see savings-tracker-spec.md section 13, step 2).

-- ผู้ใช้ (ผูกกับ auth.users ของ Supabase)
create table profiles (
  id          uuid primary key references auth.users(id),
  display_name text not null,
  role        text not null check (role in ('admin','friend')),
  created_at  timestamptz default now()
);

-- บัญชีเงินฝาก
create table accounts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  bank           text default 'KKP',
  account_type   text,
  receiver_name  text,
  owner_id       uuid references profiles(id),
  beneficiary_id uuid references profiles(id),
  interest_payout text default 'semiannual',
  tax_enabled    boolean default false,
  created_at     timestamptz default now()
);

-- รายการเคลื่อนไหว (หัวใจของระบบ)
create table transactions (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid references accounts(id) not null,
  type           text not null check (type in ('deposit','withdrawal','interest','adjustment')),
  amount_cents   bigint not null,
  occurred_at    timestamptz not null,
  note           text,
  slip_path      text,
  slip_hash      text,
  bank_reference text unique,
  ocr_confidence numeric(3,2),
  ocr_raw        jsonb,
  needs_review   boolean default false,
  created_by     uuid references profiles(id),
  created_at     timestamptz default now(),
  edited_at      timestamptz,
  cancel_requested boolean default false
);
create index on transactions (account_id, occurred_at desc);

-- อัตราดอกเบี้ยขั้นบันได (มีวันที่มีผล -> คำนวณย้อนหลังได้ถูก)
create table interest_rate_tiers (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid references accounts(id) not null,
  effective_from date not null,
  effective_to   date,
  tier_order     int not null,
  min_balance    numeric(15,2) not null,
  max_balance    numeric(15,2),
  annual_rate    numeric(6,5) not null,
  source_note    text,
  source_url     text
);

-- ดอกเบี้ยสะสมรายวัน (คำนวณล่วงหน้าเก็บไว้เพื่อความเร็ว)
create table interest_accruals (
  account_id     uuid references accounts(id),
  accrual_date   date not null,
  closing_balance numeric(15,2) not null,
  effective_rate numeric(6,5) not null,
  interest       numeric(15,6) not null,
  primary key (account_id, accrual_date)
);

-- รอบการจ่ายดอกเบี้ย (เทียบประเมิน vs จริง)
create table interest_periods (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid references accounts(id),
  period_start    date not null,
  period_end      date not null,
  estimated_gross numeric(15,2),
  actual_gross    numeric(15,2),
  tax_withheld    numeric(15,2) default 0,
  actual_net      numeric(15,2),
  variance_pct    numeric(6,2) generated always as
                  (case when estimated_gross > 0
                        then (actual_gross - estimated_gross) / estimated_gross * 100
                        end) stored,
  recorded_by     uuid references profiles(id),
  recorded_at     timestamptz
);

-- เป้าหมาย
create table goals (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid references accounts(id),
  title         text not null,
  target_amount numeric(15,2) not null,
  target_date   date,
  is_active     boolean default true,
  achieved_at   timestamptz,
  created_at    timestamptz default now()
);

-- Badge ที่ได้รับ
create table achievements (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id),
  badge_code   text not null,
  earned_at    timestamptz default now(),
  unique (profile_id, badge_code)
);

-- กระทบยอดรายเดือน
create table reconciliations (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid references accounts(id),
  as_of_date     date not null,
  bank_balance   numeric(15,2) not null,
  system_balance numeric(15,2) not null,
  difference     numeric(15,2) generated always as (bank_balance - system_balance) stored,
  resolved       boolean default false,
  note           text,
  created_at     timestamptz default now()
);

-- Audit log (append-only ห้ามแก้ห้ามลบ)
create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (section 10) — enable on every table before
-- exposing this project to the friend's account.
-- ============================================================
alter table transactions enable row level security;

create policy "read own account" on transactions for select
  using (account_id in (
    select id from accounts
    where owner_id = auth.uid() or beneficiary_id = auth.uid()
  ));

create policy "insert own account" on transactions for insert
  with check (account_id in (
    select id from accounts
    where owner_id = auth.uid() or beneficiary_id = auth.uid()
  ));

create policy "update rules" on transactions for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or (created_by = auth.uid() and created_at > now() - interval '24 hours')
  );

create policy "admin delete only" on transactions for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- TODO before going live: enable RLS + equivalent policies on accounts,
-- interest_rate_tiers, interest_accruals, interest_periods, goals,
-- achievements, reconciliations and audit_log too (read-only for both
-- roles on audit_log, admin-only writes on the rate/reconciliation tables).
