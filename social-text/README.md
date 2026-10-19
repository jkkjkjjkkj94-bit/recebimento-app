# Voz — rede social de texto

MVP de uma rede social focada em publicações de texto.

## Recursos
- Cadastro e login por e-mail com Supabase Auth
- Perfil com nome e @usuário
- Feed de textos de até 500 caracteres
- Curtidas e exclusão das próprias publicações
- Atualização em tempo real via Supabase Realtime
- Banco PostgreSQL protegido por Row Level Security (RLS)

## Backend
O frontend está conectado ao projeto Supabase `innziuzgtpfsiywqmies` usando apenas a chave pública/publishable no navegador. Nunca coloque `service_role` no frontend.

As tabelas `profiles`, `posts`, `likes` e `follows` foram criadas com RLS. As tabelas `posts` e `likes` foram adicionadas à publicação `supabase_realtime`.

## Rodar
Sirva esta pasta por HTTP (por exemplo, GitHub Pages ou um servidor estático). Abra `index.html`, crie uma conta e confirme o e-mail caso a confirmação esteja habilitada no projeto Supabase.
