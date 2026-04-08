create table if not exists public.contract_entities (
  id char(36) primary key,
  organization_id varchar(191) not null,
  entity_code varchar(50) not null,
  entity_name varchar(255) not null,
  short_name varchar(100) not null,
  legal_representative varchar(100),
  tax_rate numeric(5,4) not null default 0.0000,
  tax_id varchar(100),
  bank_name varchar(200),
  bank_account_no varchar(100),
  bank_account_name varchar(200),
  swift_code varchar(50),
  seal_oss_key varchar(500),
  seal_position_x integer,
  seal_position_y integer,
  seal_width integer,
  seal_height integer,
  currency varchar(10) not null default 'CNY',
  address text,
  contact_phone varchar(50),
  is_active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  created_by char(36),
  updated_by char(36)
);

create unique index if not exists uk_contract_entities_org_code
on public.contract_entities (organization_id, entity_code);

create index if not exists idx_contract_entities_org_active_currency
on public.contract_entities (organization_id, is_active, currency);

create index if not exists idx_seal_oss_key
on public.contract_entities (seal_oss_key);
