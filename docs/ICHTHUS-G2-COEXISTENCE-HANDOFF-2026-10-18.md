# Ichthus G2 — recuperação segura do handoff de coexistência

**Diagnóstico:** 18/10/2026, `POST /api/meta/onboarding/exchange` retornou 403 (`O ativo retornado pelo Embedded Signup ainda não está cadastrado para handoff seguro`). O código de produção só possui handoff de Eduardo Brasil. A autorização Meta exibiu coexistência ativa, mas nenhum armazenamento operacional foi comprovado.

## Escopo deste PR

- Mantém a conexão legada Eduardo com o **mesmo WABA ID, Phone Number ID e URL**.
- Inclui Ichthus na lista de destinos **somente** quando `ICHTHUS_META_HANDOFF_ENABLED=true` **e** `ICHTHUS_META_HANDOFF_URL` for uma URL HTTPS explicitamente aceita.
- Para Ichthus, exige correspondência **exata e simultânea** de WABA `107697061976892` e Phone Number ID `107612478652254`; nunca usa número textual para roteamento e nunca seleciona Ichthus na ausência de identificadores.
- LA não é incluída nem modificada; manter o fluxo e os webhooks atuais separados.
- Não altera callback global da Meta, App Secret, token de Eduardo/LA, banco, variáveis Vercel nem integração real.

## Dependências antes de qualquer ativação

1. Implementar e homologar em `proxy-relationship-demo` o endpoint interno `POST /api/relationship/meta/credentials` com **assinatura HMAC + timestamp**, antirreplay, validação do par WABA/Phone ID, armazenamento cifrado, proteção por tenant e resposta de fingerprint. Não reutilizar endpoint de Eduardo.
2. Confirmar, com testes, que o endpoint receptor realmente existe no domínio indicado. Não usar a URL aprovada apenas por corresponder ao formato.
3. Verificar se a Ichthus tem uma WABA nova em relação ao registro histórico de teste e documentar a vinculação ao tenant correto. Não substituir os IDs históricos.
4. Validar o tratamento de credenciais e webhooks isolados da Ichthus, respeitando os roteamentos de Eduardo e LA.
5. Somente após revisão e autorização específica de produção, definir as duas variáveis no projeto `proxy` e publicar a alteração. Sem ambas, permanece desabilitada.
6. Repetir apenas a autorização de credencial no Embedded Signup, quando solicitado. O código anterior da Meta não deve ser reutilizado. Não desconectar o WhatsApp Business App.
7. Depois, verificar WABA subscription, webhook por WABA, inbound real consentido, outbound humano e status, sem automação de IA.

## Rollback

Desativar `ICHTHUS_META_HANDOFF_ENABLED` e publicar configuração; o destino Eduardo permanece no código. Se necessário, reverter somente este PR. Não alterar nem limpar credenciais ou assinaturas existentes de outros tenants.

## Limites

Este PR **não conclui o onboarding**, não marca a credencial como armazenada, não autoriza reexecutar o fluxo Meta agora e não habilita WhatsApp no CRM. A página de onboarding antiga continua em produção até autorização e rollout controlado.
