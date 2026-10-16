-- ADIMAX: acesso compartilhado sem login.
-- ATENÇÃO: quem acessar o site poderá consultar, cadastrar, editar e excluir
-- todos os registros compartilhados. Não use esta configuração para dados
-- confidenciais. Não concede acesso aos registros de outros user_id.
-- Execute manualmente no SQL Editor do projeto Supabase após revisar os riscos.

begin;

grant select, insert, update, delete on table public.agendamentos_cargas to anon;

drop policy if exists "Public can view shared loads" on public.agendamentos_cargas;
drop policy if exists "Public can create shared loads" on public.agendamentos_cargas;
drop policy if exists "Public can update shared loads" on public.agendamentos_cargas;
drop policy if exists "Public can delete shared loads" on public.agendamentos_cargas;

create policy "Public can view shared loads"
on public.agendamentos_cargas for select to anon
using (user_id = '00000000-0000-4000-8000-000000000001'::uuid);

create policy "Public can create shared loads"
on public.agendamentos_cargas for insert to anon
with check (user_id = '00000000-0000-4000-8000-000000000001'::uuid);

create policy "Public can update shared loads"
on public.agendamentos_cargas for update to anon
using (user_id = '00000000-0000-4000-8000-000000000001'::uuid)
with check (user_id = '00000000-0000-4000-8000-000000000001'::uuid);

create policy "Public can delete shared loads"
on public.agendamentos_cargas for delete to anon
using (user_id = '00000000-0000-4000-8000-000000000001'::uuid);

commit;
