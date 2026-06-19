-- Configuração de taxas da Calculadora (CRUD).
-- Uma única linha global (id = 'default') guardando toda a hierarquia
-- (Tipo de Taxa > Gateway > Bandeira > Parcelas > valores) como JSON.
-- Mesmo padrão da tabela `presets`.

create table if not exists public.rate_configs (
  id text primary key default 'default',
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_configs enable row level security;

-- Acesso aberto via chave anon (o app usa login único do lado do cliente,
-- mesmo modelo das demais tabelas já em uso).
create policy "rate_configs_select" on public.rate_configs
  for select using (true);

create policy "rate_configs_insert" on public.rate_configs
  for insert with check (true);

create policy "rate_configs_update" on public.rate_configs
  for update using (true) with check (true);
