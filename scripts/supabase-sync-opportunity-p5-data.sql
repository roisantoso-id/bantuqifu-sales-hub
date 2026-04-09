alter table public.opportunity_p5_data
add column if not exists "contractEntityId" char(36);

create index if not exists idx_opportunity_p5_contract_entity_id
on public.opportunity_p5_data ("contractEntityId");
