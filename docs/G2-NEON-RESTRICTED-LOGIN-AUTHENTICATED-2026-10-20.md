# G2 — Evidência de autenticação restrita no Neon isolado (20/10/2026)

**Escopo:** somente a branch descartável `br-rapid-leaf-b5cbnesr` de `proxy-whapp-platform`. **Sem merge, sem deploy, sem integração Meta e sem alterações nas branches production/staging.**

## Execução

Após o operador confirmar `Statement executed successfully` para a definição manual de uma senha temporária da role criada via SQL `proxy_meta_ichthus_replay_login`, validamos por conexão autenticada com `role_name` explícito.

### Resultados observados

- `current_user = proxy_meta_ichthus_replay_login`; `row_security=on`.
- `pg_authid`: `LOGIN=true`, `BYPASSRLS=false`, `SUPERUSER=false`, `CREATEDB=false`, `CREATEROLE=false`, senha configurada (sem ler valor/hash).
- Ledger: primeiro `INSERT ... ON CONFLICT DO NOTHING RETURNING permit_id` com dados sintéticos do tenant Ichthus retornou uma linha; replay exato retornou zero linhas.
- Tentativa sintética de INSERT para outra organização recebeu `new row violates row-level security policy`.
- Tentativa de consultar `core.whatsapp_connection_secrets` foi recusada com `permission denied for schema core`. Nenhuma linha/segredo real foi lido.
- `has_column_privilege` confirmou INSERT e SELECT da coluna `permit_id`; `has_table_privilege DELETE=false`.
- Não foi armazenada senha, URI de conexão, token Meta ou qualquer credencial nos repositórios.

## Limites

A evidência valida login e execução de SQL autenticados na **branch Neon descartável** usando o conector, não confirma ainda `pg.Pool` Node/Vercel apontando para esse Neon. Os testes automatizados anteriores (#16) já validaram o pool Node e concorrência em PostgreSQL descartável de GitHub Actions. Para a integração real, falta conectar o adaptador via canal de segredos privado e validar a cadeia CRM → Proxy com dados sintéticos, sem ativar a rota de troca Meta.

A senha de homologação foi digitada no SQL Editor pelo operador; pode haver retenção do texto no histórico do Neon. **Rotacionar essa senha antes de qualquer uso fora da homologação**, evitando copiá-la para GitHub, PRs ou logs. O script não deve ficar salvo com senha em texto. Após os testes, desativar o login e excluir a branch somente mediante autorização específica.
