# G2 — Adaptador PostgreSQL central, STAGED (20/10/2026)

**Status:** componente testável em código, sem conexão de produção, sem integração com rota HTTP e sem Meta Graph API. Referência: [Plano de homologação isolada](./G2-CRM-PROXY-ISOLATED-HOMOLOGATION-PLAN-2026-10-20.md). PR #19 continua draft.

## Escopo implementado

- `lib/ichthus-proxy-replay-pg-store.mjs` aceita um pool PostgreSQL **injetado exclusivamente do servidor**. Não carrega URL, token, segredo nem `pg` neste módulo e não se conecta autonomamente.
- Confere `current_user`, `rolsuper=false` e `rolbypassrls=false` em **cada conexão**. O nome de login esperado é `proxy_meta_ichthus_replay_login`; ele **ainda não foi criado** no Neon e o SQL `0002` disponibiliza somente a role **NOLOGIN** de privilégios `proxy_meta_ichthus_replay_writer`.
- Usa `BEGIN`, `INSERT ... ON CONFLICT DO NOTHING RETURNING permit_id`, `COMMIT`; só depois devolve `rowCount:1` (primeiro consumo) ou `rowCount:0` (ticket ou nonce já consumido).
- Falha ao abrir conexão, role indevida, erro de query ou falha de commit são **indisponibilidade**, jamais autorização ou replay confirmado; tenta `ROLLBACK` e libera a conexão sem revelar detalhes internos ao cliente.
- `tests/ichthus-proxy-replay-pg-store.test.mjs`: testes com pool falso para sequência SQL, papel privilegiado, commit, rollback, replays e SQL incompatível. A suíte GitHub Actions PostgreSQL 17 descartável continua validando as duas constraints UNIQUE e as policies de `0001`/`0002`.

## Pré-requisitos operacionais ainda pendentes

1. Aprovar ambiente Neon **descartável e separado** no projeto `proxy-whapp-platform` (sem modificar staging/production).
2. Provisionar sob autorização explícita um **LOGIN distinto** `proxy_meta_ichthus_replay_login`, `NOBYPASSRLS`, com acesso via `proxy_meta_ichthus_replay_writer` e nenhuma herança ampla, sem tocar papéis atuais. Conexão técnica em escopo privado da Proxy, jamais na UI ou CRM.
3. Escolher e instalar driver PostgreSQL (`pg` ou compatível) atualizando `package.json` **e lockfile vigente**, após revisão da convenção npm/pnpm neste projeto. Este adaptador permanece pool-injected para não introduzir driver ou configuração ambiente inadvertidamente.
4. Testar com **conexões simultâneas reais** no ambiente isolado e processos separados, validando que um único `INSERT` vence para o mesmo ticket/nonce. Os testes unitários usam pool falso e não demonstram, sozinhos, confirmação real de commit ou concorrência no Node.
5. Confirmar Meta config_id e modo de coexistência da LA/Ichthus; implementar o controlador seguro CRM→Proxy e seu ledger antes de habilitar qualquer endpoint.
6. Não modificar `app/api/meta/onboarding/exchange/route.ts` legado usado por Eduardo; não mudar callback global, tokens nem canais existentes.

**Rollback futuro:** desativar flags e LOGIN de integração sem apagar os registros de consumo (necessários à garantia anti-replay). **Nenhuma mudança real foi executada nesta rodada.**
