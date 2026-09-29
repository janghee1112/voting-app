create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz not null default now()
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  position integer not null,
  vote_count integer not null default 0
);

create index if not exists options_poll_id_idx on options (poll_id);

-- 부록: 마감 시각 (nullable, 기존 투표는 무기한)
alter table polls add column if not exists closes_at timestamptz;
