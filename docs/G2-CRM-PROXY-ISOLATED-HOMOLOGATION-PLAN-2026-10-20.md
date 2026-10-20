# G2 — Plano de homologação isolada CRM → Proxy (20/10/2026)

**Status:** proposta operacional, NÃO aprovada para execução. Não criar projeto/branch/role/banco, não instalar secrets, não aplicar migration, não conectar Meta, não fazer merge sem aprovação separada. PRs de origem: Proxy #19 e CRM #10.

## Infraestrutura observada (Neon read-only)

- Candidato: `proxy-whapp-platform`, project `twilight-bird-41764457`, com branches `production` e `staging`. Usar a responsabilidade central de WhatsApp desse projeto **sem escrever em seus ambientes atuais**.
- Comparativo: `proxy-service-platform` já existe, mas trata do plano de controle geral e não é a primeira opção para registro de replay de canal.
- `proxy-whapp-platform/staging` tem tabelas `core` existentes e roles consultadas com `BYPASSRLS`; portanto **não usar credencial de proprietário/admin nem assumir RLS existente**.
- A suíte GitHub Actions de `proxy` aprovou o contrato SQL e as políticas propostas em PostgreSQL descartável; isso não substitui homologação no Neon isolado.

## Plano técnico de execução futura, com aprovação específica por gate

1. **Selecionar e aprovar ambiente descartável**: preferir branch Neon temporária independente de `production` e `staging`, com nome inequívoco de homologação G2; não incluir credenciais comerciais nos testes. Não criar no passo documental.
2. **Verificar papéis/ACLs e plano de reversão**: antes de SQL, demonstrar que schema `proxy_meta` não existe ou reconciliar sem apagar objetos, que o papel restrito está ausente ou é compatível, e registrar grants herdados e `search_path`.
3. **Executar exclusivamente SQL aprovado**: revisar `db/staged/0001_ichthus_proxy_permit_replay_STAGED.sql` e `0002_ichthus_proxy_replay_writer_STAGED.sql`, em transação controlada e com role administrativa apenas durante provisionamento. O processo web terá LOGIN distinto, `NOBYPASSRLS`, sem acesso a `core`, tokens Meta ou outras organizações.
4. **Driver Node e integração**: escolher driver PostgreSQL explícito para o repo `proxy` (atualmente não possui um). `consumeOnce` só retorna true depois de INSERT atômico com `UNIQUE (organization_id,permit_id)` e `UNIQUE (organization_id,nonce_digest)` e **COMMIT**. Segredos/URLs privados devem estar apenas no ambiente de teste da Proxy, nunca no cliente.
5. **Teste duas sessões/instâncias**: 12 tentativas paralelas do mesmo ticket, duas autorizações com mesmo nonce, falha de banco, erro de commit, tenant distinto, prazo vencido e revogação de permissões. Confirmar uma vitória e todas as demais recusadas; rollback de credencial de teste sem apagar registros que representem tickets consumidos.
6. **Ligação offline de ponta a ponta**: no CRM, associar state a sessão/tenant autenticados e consumir ledger com commit; somente então emitir ticket HMAC distinto do `META_APP_SECRET`; Proxy valida/consome ticket antes de qualquer troca. Testes usam códigos e tokens fictícios, sem Graph API.
7. **Gate Meta posterior**: confirmar `META_WHATSAPP_CONFIG_ID` real da LA e configuração de coexistência da Ichthus; definir callback específico da WABA sem alterar callback global, e somente então submeter plano de autorização real.

## Critérios para aprovação

- Revisão de código e CI dos PRs #10/#19 concluídos.
- Evidência de isolamento multiempresa tanto no CRM quanto na Proxy, incluindo RLS, papel mínimo e impossibilidade de ler `core.whatsapp_connection_secrets`.
- Sem dependência do fluxo Eduardo ou alterações nos canais existentes; sem criação de novos tenants ou usuários reais.
- Checklists de rollback documentados: desligar flags e LOGIN técnico, jamais excluir credenciais de clientes como medida de rollback.
- Nenhum endpoint de troca OAuth exposto antes de toda a cadeia de proteção e observabilidade server-side.

**Estado atual:** apenas contrato de domínio e testes offline no GitHub. Implantação Neon, ligação de endpoint e conexão Meta continuam bloqueadas.
