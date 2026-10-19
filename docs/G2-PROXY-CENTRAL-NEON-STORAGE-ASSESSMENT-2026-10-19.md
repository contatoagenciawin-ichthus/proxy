# G2 — Inventário Neon e decisão de armazenamento central (somente leitura)

**Data:** 19/10/2026. **Status:** avaliação arquitetural; não autoriza criação de banco, role, segredos, aplicação de migrations, endpoints ou deploy.

## Evidência observada em Neon (consulta autenticada read-only)

| Projeto | ID | Branches existentes | Conteúdo observado |
| --- | --- | --- | --- |
| `proxy-whapp-platform` | `twilight-bird-41764457` | `production`: `br-sweet-block-b50tvrn8`; `staging`: `br-dark-meadow-b53nd0a9` | schema `core`: `organizations`, `whatsapp_connections`, `whatsapp_connection_secrets`, `whatsapp_webhook_events`, `audit_events`; staging inclui `messaging_events`, `adapter_deliveries` |
| `proxy-service-platform` | `red-dust-96680196` | `production`: `br-wandering-block-b57ep548`; `staging`: `br-dark-silence-b5505rrl` | schema `platform`: organizações, módulos/configurações, perfis e permissões de assistentes, auditoria; staging inclui memórias/snapshots |
| `proxy-relationship-intelligence-dev` | `bold-forest-86250299` | ambiente CRM já existente | **Não usar** como armazenamento canônico do serviço central; pertence ao produto receptor |

Em `proxy-whapp-platform/staging` e `proxy-service-platform/staging`, as tabelas inspecionadas em `core`/`platform` reportaram `relrowsecurity=false` e `relforcerowsecurity=false`. Essa constatação **não prova vazamento de dados**, pois pode haver controle por roles/aplicação; porém veda assumir isolamento por RLS sem configuração explícita. Não foram lidos tokens nem linhas comerciais.

## Decisão proposta (ainda não aprovada operacionalmente)

**Reaproveitar inicialmente o projeto Neon `proxy-whapp-platform` como candidato preferencial** ao ledger central de troca OAuth, em schema **separado** `proxy_meta`. Justificativa: esse projeto já tem responsabilidade de integrações WhatsApp e branches staging/production. Não misturar a nova tabela com `core.whatsapp_connection_secrets` nem com o banco do CRM. `proxy-service-platform` fica como alternativa caso limites de administração, ownership ou infraestrutura inviabilizem a separação no primeiro projeto.

A existência de um projeto não implica disponibilidade de conexão de runtime para o repositório `proxy`: ele ainda não declara driver PostgreSQL. O passo técnico futuro é aprovar `pg`/driver compatível e configuração privada por ambiente, sem expor conexão em log ou navegador.

## Limites de segurança obrigatórios

1. **Sem alterar `core` ou tabelas preexistentes**. Aplicar somente `db/staged/0001...` e `0002...` após reconciliação de roles/grants e aprovação para ambiente isolado.
2. A role efetiva precisa ser LOGIN específico (não reutilizar `neondb_owner`), `NOSUPERUSER/NOBYPASSRLS`, sem herdar permissões gerais, e acessar apenas `proxy_meta.ichthus_exchange_permit_uses` via papel mínimo. `0002` cria só a role NOLOGIN de privilégio, **não** provisiona conta técnica.
3. No PostgreSQL, **revisar ACL de schema e default privileges**: revogar quaisquer grants herdados e demonstrar explicitamente que a role de serviço **não** consegue ler `core.whatsapp_connection_secrets`, `core.whatsapp_connections`, `platform` nem alterar DDL ou outros tenants.
4. RLS e uniques obrigatórios em `(organization_id,permit_id)` **e** `(organization_id,nonce_digest)`, garantindo bloqueio de replay mesmo quando um novo permitId é assinado.
5. O `INSERT ... RETURNING` só confirma o uso após **COMMIT** bem-sucedido; erro, indisponibilidade e dados de outro tenant bloqueiam o OAuth; testes em duas sessões distintas simulando múltiplas instâncias.
6. Aplicação deve ser validada primeiro em ambiente **descartável criado especificamente para homologação**, sem depender de staging operacional da Proxy nem herdar seus segredos. Não criar branch sem nova autorização explícita de mudança de infraestrutura.
7. A Proxy mantém `META_APP_SECRET`; CRM usa segredo novo de ticket server-to-server, separado do segredo de handoff. A rota legada Eduardo permanece inalterada. LA não depende desse ledger e não será migrada.
8. Antes de ativar, comparar a configuração Meta real da LA/Ichthus, homologar callback/CSRF, armazenamento do CRM e vínculo entre state consumido e troca do código OAuth; nenhum ticket confere autorização para enviar mensagens.

## Testes já executados

A suíte [`g2-ichthus-permit-security.yml`](../.github/workflows/g2-ichthus-permit-security.yml) executou com sucesso em PostgreSQL 17 **descartável do GitHub Actions**, inclusive a role restrita e a negação entre tenants. Não foi implantada no projeto Neon acima.

## Gate seguinte

Registrar uma proposta de implantação detalhada para `proxy-whapp-platform` e aprovar separadamente **qual branch descartável**, database, papel mínimo e variáveis por ambiente poderão ser criados. Antes disso, continuar apenas com código/tests offline e revisão de permissões read-only.
