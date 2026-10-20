# G2 — Homologação Neon descartável: bloqueio de role privilegiada

**Data:** 20/10/2026. **Status:** parcial, bloqueado para teste de pool autenticado. Este relatório não autoriza nenhum bypass de controle do Neon.

## Ambiente criado com autorização do usuário

- Projeto Neon: `proxy-whapp-platform`, ID `twilight-bird-41764457`.
- **Branch nova descartável:** `g2-ichthus-oauth-replay-disposable-20261020`, ID `br-rapid-leaf-b5cbnesr`, derivada de `staging` (`br-dark-meadow-b53nd0a9`).
- A primeira tentativa de criar a branch com `suspend_timeout_seconds=300` foi recusada pelas regras da conta Neon (HTTP 412). A branch foi criada usando a configuração padrão.
- Somente na nova branch, foram executadas as migrações `db/staged/0001_ichthus_proxy_permit_replay_STAGED.sql` e `0002_ichthus_proxy_replay_writer_STAGED.sql`. Schema `proxy_meta`, ledger UNIQUE de tickets e nonces, FORCE RLS e role `proxy_meta_ichthus_replay_writer` **NOLOGIN**. Não houve alteração em `core`, `production` ou `staging`.
- A branch derivada pode conter *snapshot* de dados anteriores da branch de staging. Não consultamos tokens, segredos ou linhas comerciais. Evitar compartilhá-la ou vincular à Vercel até aprovação.

## Impedimento constatado

Foi criado temporariamente no mesmo branch, via Neon, `proxy_meta_ichthus_replay_login` para homologação. A leitura de `pg_roles` mostrou que essa role tinha **LOGIN=true, BYPASSRLS=true, CREATEDB=true e CREATEROLE=true**, incompatíveis com a exigência de runtime restrito. Uma tentativa de retirar os privilégios via alteração de role foi negada pelo Neon com `permission denied to alter role`. **Não houve tentativa de contornar a restrição por outro método.**

Como contenção, **o login temporário foi excluído** via operação suportada pelo Neon. Uma nova consulta de `pg_roles` confirmou que apenas `proxy_meta_ichthus_replay_writer` permanece com `LOGIN=false, BYPASSRLS=false, SUPERUSER=false`. Nenhuma credencial técnica desse teste foi escrita em GitHub, Vercel ou aplicações.

**Consequência:** não podemos ligar o adaptador Node ao Neon, porque `createIchthusProxyReplayStore` exige explicitamente login `proxy_meta_ichthus_replay_login` com `rolsuper=false` e `rolbypassrls=false`. Esse bloqueio é intencional e deve ser mantido.

## Evidências já aprovadas separadamente

- GitHub Actions Proxy #16 comprovou adaptação Node `pg.Pool` com PostgreSQL 17 descartável, login sintético restrito e testes concorrentes; isso não equivale a conexão Neon real.
- CRM PR #10: geração de state, consumo de nonce e emissão de ticket depois do commit, com autorização administrativa dupla; validação anterior em CI.
- Fluxos de Eduardo Brasil, LA e conta Meta Ichthus **não foram alterados**.

## Próxima decisão operacional

1. Verificar com o suporte/administração Neon um mecanismo **oficialmente permitido** para criar uma role `LOGIN NOBYPASSRLS NOCREATEDB NOCREATEROLE` na branch descartável, sem utilizar nem conceder login privilegiado. Se não houver, manter o gate fechado e considerar banco efêmero externo específico ou outro método aprovado.
2. Não criar segredos compartilhados, não modificar política de segurança do projeto, nem ligar o endpoint Meta enquanto o papel restrito não for demonstrado por `pg_roles`.
3. Validar com dois pools reais usando esse login limitado e verificar impossibilidade de acessar `core.whatsapp_connection_secrets`. Somente então avançar para ensaio autenticado CRM → Proxy no Neon.
4. Ao encerrar a homologação, solicitar aprovação para excluir a branch inteira, que pode incluir cópia de staging, evitando deixar dados clonados desnecessariamente.
