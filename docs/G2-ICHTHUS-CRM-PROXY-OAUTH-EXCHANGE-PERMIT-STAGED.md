# G2 — Contrato CRM → Proxy para troca OAuth (somente STAGED)

Data: 19/10/2026. **Não conectado à rota real.** A página da LA continua sendo a referência da experiência de onboarding. Eduardo Brasil e LA não foram alterados.

## Componentes revisados

- CRM PR #10: `lib/relationship/proxy-exchange-permit.mjs` cria ticket HMAC de uso pretendido único, com audience `proxy-tech-provider:ichthus:oauth-code-exchange`, tenant Ichthus, WABA `107697061976892`, Phone Number ID `107612478652254`, config_id escolhido, SHA-256 do nonce e identificador aleatório de autorização; validade de 60 segundos.
- Proxy PR #19: `lib/ichthus-crm-exchange-permit.mjs` verifica assinatura, finalidade, validade, tenant e ativos; não possui rota HTTP conectada.
- Protocolo **não transporta o código OAuth nem token Meta no ticket**; esses valores não devem ser gravados em logs. Deve usar segredo **novo** e dedicado de comunicação CRM→Proxy, distinto tanto de `META_APP_SECRET` quanto de `ICHTHUS_HANDOFF_SIGNING_SECRET`.

## Gatilhos que obrigatoriamente precedem a ativação

1. Verificar o `META_WHATSAPP_CONFIG_ID` real da LA e a configuração Meta da Ichthus, sem presumir IDs iguais.
2. O CRM deve emitir ticket **somente após** o registro do state OAuth ter sido consumido em uma transação confirmada por sessão e tenant autenticados.
3. A Proxy deve manter **ledger próprio de uso único** do `permitId` e consumir atomicamente **antes** de trocar código OAuth na Meta; a assinatura por si só não impede replay.
4. A rota de produção existente `/api/meta/onboarding/exchange` continua com fluxo legado Eduardo. Para Ichthus, exigir acesso autenticado server-to-server e comprovar o vínculo do código OAuth à autorização do CRM, incluindo state/CSRF, configuração e evento Embedded Signup. **Não aceitar POST direto do navegador para essa modalidade.**
5. Evitar requisições externas dentro de transações de banco; definir rollback de flags, rotação de segredos e ambiente de homologação isolado.
6. Confirmar Vercel preview sem compartilhamento indevido de variáveis de produção e autorizar separadamente migration 0109, segredos, deploy e Meta.

**Limite:** os helpers foram colocados em código com testes offline; nenhum segredo foi configurado, nenhuma URL de produção foi alterada, nenhum onboarding foi iniciado e nenhum endpoint foi ativado. O ticket apresentado é um contrato técnico em revisão, não autorização operacional.


## Proteção de replay no serviço Proxy — 19/10/2026

- `lib/ichthus-proxy-permit-replay.mjs`: verificação criptográfica prévia do ticket e encaminhamento para armazenamento central obrigatório e atômico. Sem armazenamento disponível, falha fechada; nenhum código OAuth é trocado.
- `db/staged/0001_ichthus_proxy_permit_replay_STAGED.sql`: esquema proposto, **não aplicado**, com restrições UNIQUE tanto de `(organization_id, permit_id)` quanto de `(organization_id, nonce_digest)`. Um segundo ticket para o mesmo nonce também é rejeitado. Nenhuma permissão operacional concedida.
- `tests/ichthus-proxy-permit-replay.test.mjs`: cenários de replay, concorrência, tenant divergente, expiração, ausência do armazenamento, mesmo nonce com outro permitId e contrato SQL.
- No momento o repositório Proxy não declara um cliente PostgreSQL nem projeto de banco exclusivo para este ledger. O adaptador aceita apenas `insertAndCommit` injetado; **a implementação de persistência real e a aplicação do esquema NÃO foram concluídas**. Uma implementação em memória não atenderá o requisito multi-instância da Vercel.
- Antes de ativar, selecionar e homologar armazenamento exclusivo da Proxy, política RLS e papel mínimo; testar transação confirmada, UNIQUE concorrente e disponibilidade. O serviço emissor CRM também precisará demonstrar a ligação entre consumo do state e emissão de ticket, inclusive após falha de comunicação. Validar o `config_id` da LA por fonte apropriada.
- A rota `/api/meta/onboarding/exchange` permanece inalterada. Eduardo Brasil não pode depender destes helpers; a futura rota Ichthus deve exigir `consumeIchthusProxyPermit` e rejeitar requisições diretas do navegador antes da Meta Graph API.
