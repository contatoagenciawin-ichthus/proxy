# Ichthus · Diagnóstico Meta usando credencial do cofre (incremento preparado)

Status: **PR em revisão; não publicar, não aplicar SQL e não alterar Meta automaticamente.**

## Objetivo
Consultar somente via GET da Meta Graph API a WABA, o número, a inscrição do
aplicativo Proxy e a existência de callback específico da Ichthus, usando a
credencial protegida que já existe no cofre da Proxy. Nenhum token por cliente
na Vercel. O callback global do Eduardo Brasil e a WABA da LA permanecem intactos.

## Arquitetura
- Papel `proxy_credential_reader_login`: login separado dos papéis writer e
  provisioning; sem superuser, BYPASSRLS, CREATE ROLE ou escrita no cofre.
- `BEGIN READ ONLY`, `app.organization_id` definido por transação e
  `SELECT` por organização/protocolo/WABA/número/app, com FORCE RLS existente.
- Descriptografia AES-256-GCM no módulo backend, usando a chave da plataforma,
  AAD já existente e chave de versão conhecida; plaintext nunca é enviado ao
  navegador, CRM, auditoria ou logs.
- Página somente leitura disponível apenas após autenticação administrativa;
  verifica o recibo real do protocolo antes de consultar a Meta; habilitação
  explícita `PROXY_ICHTHUS_META_DIAGNOSTIC_ENABLED=true`.
- Resultado sanitizado: valores verificados/inconclusivos, inclusive callback
  específico apenas se a Graph API realmente devolvê-lo.

## Pré-requisitos antes de publicar
1. Localizar inequivocamente a branch/database *produtiva* do cofre, verificar
   `whatsapp_provisioning`, `whatsapp_credential_envelopes`, suas policies
   FORCE RLS, owner, grants e existência do registro Ichthus *sem ler tokens*.
   Em 10/11/2026, as branches padrão dos projetos Neon acessíveis pela conexão
   de auditoria não continham essas tabelas. Isso não autoriza criar tabelas
   ou aplicar SQL nesses bancos.
2. Testar SQL proposto em branch isolada do banco correto e demonstrar
   cross-tenant (0 rows), SELECT somente do tenant esperado, negação de
   INSERT/UPDATE/DELETE e ausência de BYPASSRLS.
3. Após aprovação operacional da migração: aplicar grants na branch correta,
   provisionar senha forte para identidade reader por canal protegido e
   configurar **uma** variável de plataforma
   `PROXY_CREDENTIAL_READER_DATABASE_URL` exclusivamente na Proxy.
   Não usar URL ou credencial da role writer, nem token Graph em env.
4. Habilitar diagnóstico explicitamente e publicar. Conferir que a função
   não consegue abrir se a role, RLS, chave ou identidade do protocolo divergirem.
5. Consulta read-only e resultado registrado no protocolo. Somente então avaliar
   a necessidade de alteração isolada de callback WABA e teste real externo.

## Restrições
- **Não** alterar callback global da Meta, token Eduardo Brasil, WABA LA,
  conexão da Ichthus ou webhooks neste incremento.
- Sem auto-subscription e sem POST na Graph API.
- Confirmação de assinatura não equivale a homologação: falta mensagem real,
  chegada no CRM e possibilidade de resposta humana.
- Este PR não instala nenhuma role/secret automaticamente. Merge sozinho não
  habilita nem executa consulta Meta.
