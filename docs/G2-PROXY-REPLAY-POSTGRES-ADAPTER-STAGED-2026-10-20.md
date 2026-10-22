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


## Homologação de concorrência TCP no PostgreSQL descartável (20/10/2026)

- `tests/sql/ichthus-proxy-replay-concurrency.sh` cria **apenas no banco efêmero do CI** o login sintético `proxy_meta_ichthus_replay_login`, herda a role restrita de escrita e executa processos `psql` independentes por conexão.
- A bateria verifica duas disputas: 12 requisições com `permit_id` idêntico e 9 com `permit_id` distinto mas `nonce_digest` idêntico. Uma única inserção por disputa pode retornar `permit_id`, em transações autocommit independentes; uma consulta de conexão separada confirma as duas linhas persistidas.
- O teste recusa host ou database diferentes de `127.0.0.1/proxy_g2_ephemeral`; não conecta Neon nem Meta.
- GitHub Actions execução **#13 falhou no coletor do teste**, que contava etiquetas de comando do `psql` como se fossem linhas retornadas. A captura foi corrigida com `psql -qAt` e **execução #14 passou** no commit `ea0ab8af`.
- A prova refere-se ao comportamento real das constraints PostgreSQL e da role sintética, **não** à integração do pool Node com conexão Neon real, a qualquer endpoint OAuth ou a emissão de credenciais Meta.

**Pendente:** implantar banco isolado autorizado, role LOGIN restrita e conexão do serviço em ambiente de homologação, sem usar os papéis existentes com `BYPASSRLS`; revisar o tratamento de erro no commit e executar teste de integração de ponta a ponta com driver real antes de ligar o endpoint.


## Node.js + PostgreSQL real e isolado — evidência 20/10/2026

- Teste `tests/ichthus-proxy-replay-pg.integration.test.mjs` exercita `createIchthusProxyReplayStore` e `consumeProxyPermitPostgresCommitted` com `pg.Pool` real contra **PostgreSQL 17 descartável** de GitHub Actions.
- O driver `pg@8.16.3` foi instalado apenas em `/tmp/proxy-g2-node` no executor efêmero; o repositório e seus lockfiles de produção não foram modificados por essa instalação. O teste só executa quando host `127.0.0.1`, base `proxy_g2_ephemeral` e path temporário esperado são fornecidos.
- Após a criação de role/login sintético no ambiente efêmero, a suite Node verifica 12 pedidos paralelos do mesmo ticket (1 sucesso, 11 replays), 9 pedidos com ticket distinto e mesmo nonce (1 sucesso, 8 replays), novo replay após commit, negação entre tenants por RLS e recusa de uma conexão administrativa `postgres`.
- **GitHub Actions execução #16, commit `58562218`, aprovada.** Os logs demonstram o teste de integração como `ok 1`, **sem SKIP**, na etapa separada `Verify Node adapter with real restricted PostgreSQL pool and concurrency`. O arquivo aparece como `SKIP` apenas na primeira passagem genérica de Node sem variáveis de integração, conforme planejado.
- Esse marco valida transação e commit do adaptador com driver real e papel de teste; não comprova acesso ao Neon, implantação Vercel, autorização Meta nem conexão WhatsApp operacional.

Próximo gate operacional: aprovar ambiente Neon isolado, login mínimo efetivo, driver e variáveis privadas apenas em preview, prova de negação de acesso a tabelas `core` e a outras organizações; depois testar comunicação CRM→Proxy com código/token fictícios. Não realizar merge ou ativação antes desses gates.
