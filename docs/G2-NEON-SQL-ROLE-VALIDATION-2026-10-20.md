# G2 — Neon role mínima criada pelo procedimento oficial (20/10/2026)

**Status:** parcialmente homologado em ambiente descartável; conexão autenticada e operação de escrita ainda NÃO homologadas. Não habilitar endpoint, Meta, Vercel ou CRM.

## Causa identificada e fonte oficial

A [documentação Neon de acesso a bancos](https://neon.com/docs/manage/database-access) informa que roles criadas por Console/API/CLI recebem a associação `neon_superuser`, com `BYPASSRLS`, `CREATEDB` e `CREATEROLE`. Em contrapartida, recomenda **SQL `CREATE ROLE`** para papéis restritos, sem esse vínculo administrativo. A negativa anterior de `ALTER ROLE` em um login criado pela API não foi contornada: esse login inseguro já havia sido excluído.

## Procedimento nesta rodada

- Projeto: `proxy-whapp-platform`, ID `twilight-bird-41764457`.
- Somente na branch temporária `br-rapid-leaf-b5cbnesr` (`g2-ichthus-oauth-replay-disposable-20261020`).
- Foi criada por SQL uma role **nova** `proxy_meta_ichthus_replay_login` com `LOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`; herdou somente `proxy_meta_ichthus_replay_writer` e teve eventuais direitos explícitos no schema `core` revogados.
- A verificação de `pg_roles` confirmou `rolcanlogin=true`, `rolbypassrls=false`, `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`.
- A verificação de `pg_auth_members` mostrou **apenas** associação ao papel restrito `proxy_meta_ichthus_replay_writer`, sem `ADMIN OPTION`. A checagem de senha mostrou `rolpassword IS NULL`: nenhum segredo foi criado, copiado ou colocado no GitHub.
- `has_schema_privilege(...,'core','USAGE')=false` e `has_table_privilege(...,'core.whatsapp_connection_secrets','SELECT')=false`; também não existe direito de `DELETE` na tabela de replay.
- As concessões de inserção/leitura são **por coluna**, não por tabela: `has_column_privilege(...,'permit_id','INSERT')=true`, `has_column_privilege(...,'nonce_digest','INSERT')=true`, `has_column_privilege(...,'permit_id','SELECT')=true`, `has_column_privilege(...,'nonce_digest','SELECT')=false`. Portanto, `has_table_privilege(...,'INSERT')=false` não significa falha nos grants por coluna.

## Limite encontrado

Foi tentado teste transacional com `SET LOCAL ROLE proxy_meta_ichthus_replay_login` para exercitar as permissões em conexão interna. Neon recusou com `permission denied to set role`. **Nenhuma alternativa de impersonation foi tentada.** A transação com teste de escrita não foi confirmada. Não inferir que a inserção operacional foi validada por esse resultado. A role permanece sem senha e não aceita conexão externa por password.

## Próximo gate

1. Revisar mecanismo oficialmente suportado para definir senha da role SQL em canal privado e expor conexão **somente** à homologação, ou obter orientação do suporte Neon quando `SET ROLE` não estiver disponível. Nunca usar o dono do banco para executar a aplicação.
2. Antes de provisionar credencial, verificar revogações de `PUBLIC` e ACLs herdadas, e executar auditoria read-only de privilégios de acesso a schemas/tabelas; depois testar com sessão realmente autenticada como `proxy_meta_ichthus_replay_login`.
3. Somente após teste de conexão restrita, provar INSERT/RETURNING, negação para tenant diferente, concorrência e negação de leitura a `core.whatsapp_connection_secrets` com o PostgreSQL real isolado.
4. Branch descartável pode conter cópia de dados de staging; planejar exclusão controlada ao final, sem modificar staging ou production.

**Segurança preservada:** nenhum token Meta, cookie, segredo comercial ou cliente WhatsApp foi consultado. PRs permanecem draft.
