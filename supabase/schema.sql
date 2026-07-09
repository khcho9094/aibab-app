-- ====================================================
-- 아이밥 (aibab) DB 스키마
-- Supabase SQL Editor에서 전체 실행
-- ====================================================

-- ────────────────────────────────────────
-- 1. 재료명 정규화 테이블 (동의어 매핑)
-- ────────────────────────────────────────
create table if not exists ingredient_aliases (
  alias       text primary key,        -- '쇠고기', '한우', 'beef'
  canonical_name text not null         -- '소고기'
);

-- 초기 동의어 데이터
insert into ingredient_aliases (alias, canonical_name) values
  ('쇠고기', '소고기'), ('한우', '소고기'), ('beef', '소고기'), ('우육', '소고기'),
  ('닭', '닭고기'), ('chicken', '닭고기'), ('계육', '닭고기'),
  ('감자', '감자'), ('potato', '감자'),
  ('당근', '당근'), ('carrot', '당근'),
  ('고구마', '고구마'), ('sweet potato', '고구마'),
  ('애호박', '애호박'), ('zucchini', '애호박'), ('호박', '애호박'),
  ('브로콜리', '브로콜리'), ('broccoli', '브로콜리'),
  ('시금치', '시금치'), ('spinach', '시금치'),
  ('두부', '두부'), ('tofu', '두부'), ('연두부', '연두부'),
  ('달걀', '달걀'), ('계란', '달걀'), ('egg', '달걀'),
  ('쌀', '쌀'), ('rice', '쌀'), ('백미', '쌀'),
  ('오트밀', '오트밀'), ('oatmeal', '오트밀'), ('귀리', '오트밀'),
  ('사과', '사과'), ('apple', '사과'),
  ('바나나', '바나나'), ('banana', '바나나'),
  ('배', '배'), ('pear', '배'),
  ('단호박', '단호박'), ('kabocha', '단호박'),
  ('양파', '양파'), ('onion', '양파'),
  ('무', '무'), ('radish', '무'), ('daikon', '무'),
  ('쌀미음', '쌀미음')
on conflict (alias) do nothing;

-- ────────────────────────────────────────
-- 2. 아이 프로필
-- ────────────────────────────────────────
create table if not exists children (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  birthdate   date not null,
  created_at  timestamptz not null default now()
);

alter table children enable row level security;

create policy "본인 아이만 조회" on children
  for select using (auth.uid() = user_id);
create policy "본인 아이만 생성" on children
  for insert with check (auth.uid() = user_id);
create policy "본인 아이만 수정" on children
  for update using (auth.uid() = user_id);
create policy "본인 아이만 삭제" on children
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────
-- 3. 알레르기
-- ────────────────────────────────────────
create table if not exists child_allergies (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references children(id) on delete cascade,
  ingredient_name text not null,
  severity        text not null check (severity in ('mild', 'severe')),
  note            text,
  confirmed_at    date,
  created_at      timestamptz not null default now()
);

alter table child_allergies enable row level security;

create policy "본인 아이 알레르기만 접근" on child_allergies
  for all using (
    exists (
      select 1 from children
      where children.id = child_allergies.child_id
        and children.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────
-- 4. 첫 시도 재료 기록
-- ────────────────────────────────────────
create table if not exists first_tries (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references children(id) on delete cascade,
  ingredient_name text not null,
  tried_at        date not null,
  reaction        text,   -- '이상 없음', '발진', '구토' 등
  note            text,
  created_at      timestamptz not null default now()
);

alter table first_tries enable row level security;

create policy "본인 아이 첫시도만 접근" on first_tries
  for all using (
    exists (
      select 1 from children
      where children.id = first_tries.child_id
        and children.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────
-- 5. 식재료
-- ────────────────────────────────────────
create table if not exists ingredients (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  canonical_name text,              -- 정규화된 재료명 (레시피 매칭용)
  quantity       numeric,
  unit           text,
  expiry_date    date,
  category       text,
  is_favorite    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_ingredients_user_expiry
  on ingredients(user_id, expiry_date);

alter table ingredients enable row level security;

create policy "본인 식재료만 접근" on ingredients
  for all using (auth.uid() = user_id);

-- ────────────────────────────────────────
-- 6. 레시피
-- ────────────────────────────────────────
create table if not exists recipes (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  age_min_months  int not null,
  age_max_months  int,
  steps           text[] not null default '{}',
  tip             text,
  is_ai_generated boolean not null default false,
  verified_status text not null default 'ai_beta'
    check (verified_status in ('verified', 'ai_beta')),
  created_at      timestamptz not null default now()
);

-- 레시피는 전체 공개 (RLS 불필요, 읽기 전용)
alter table recipes enable row level security;

create policy "레시피 전체 공개" on recipes
  for select using (true);

-- ────────────────────────────────────────
-- 7. 레시피-재료 매핑
-- ────────────────────────────────────────
create table if not exists recipe_ingredients (
  recipe_id       uuid not null references recipes(id) on delete cascade,
  ingredient_name text not null,   -- canonical_name 기준
  quantity        text,
  is_optional     boolean not null default false,
  primary key (recipe_id, ingredient_name)
);

alter table recipe_ingredients enable row level security;

create policy "레시피 재료 전체 공개" on recipe_ingredients
  for select using (true);

-- ────────────────────────────────────────
-- 8. 저장한 레시피
-- ────────────────────────────────────────
create table if not exists saved_recipes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  uuid not null references recipes(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table saved_recipes enable row level security;

create policy "본인 저장 레시피만 접근" on saved_recipes
  for all using (auth.uid() = user_id);
