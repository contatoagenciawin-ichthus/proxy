# Ichthus — receptor mínimo da solicitação CRM → Proxy
Data: 2026-11-08. Status: **Preparado em PR; desativado e não habilitado na produção**.

## Escopo
Somente o endpoint POST `/api/meta/admin/connection-requests` com HMAC e timestamp, allowlist estrita por organização, recibo idempotente e armazenamento PostgreSQL isolado, copiados da homologação G2 validada. O endpoint não troca tokens Meta, não configura WABA, não recebe mensagens WhatsApp e não altera os webhooks de Eduardo Brasil ou L.A. Climatização. O domínio e a página da demonstração do CRM são independentes.

Organização Ichthus **identificada no CRM existente**: `e9b935b6-3349-4b2c-970d-be8ad3bc243d`. Esse identificador ainda deve ser validado contra a organização autorizada no ambiente de implantação; não aceitar IDs enviados livremente por cliente.

## Gates antes de ligar o endpoint
1. Confirmar qual projeto/banco Neon é o armazenamento **operacional apropriado da Proxy**. A homologação G2 `falling-mouse-74404571` é descartável e **não** deve ser compartilhada com produção.
2. Revisar e aplicar, mediante aprovação operacional separada, `db/staged/0001_proxy_connection_receipts.sql` somente ao banco correto. Prover login específico (não-superuser, `NOBYPASSRLS`) com membership `proxy_connection_receiver_restricted`; validar RLS de outra organização, unicidade do protocolo e idempotência.
3. Adicionar na Vercel Proxy segredos dedicados para o receptor: `PROXY_CONNECTION_REQUEST_DATABASE_URL` e `PROXY_CONNECTION_REQUEST_SHARED_SECRET`. Restrição `PROXY_CONNECTION_REQUEST_ALLOWED_ORGS` deve conter somente a organização Ichthus. Manter `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=false` até confirmar o banco, HMAC e o despachante CRM.
4. Do lado do CRM, uma credencial restrita de worker precisa existir no banco G1 e o acionamento da outbox deve ocorrer somente **depois do commit** da solicitação autorizada. O worker homologado permanece Preview-only e ligado à organização sintética; adaptar para o piloto real sem copiar credenciais de teste.
5. Ativar Proxy primeiro e CRM em seguida, com rollback por flags; testar protocolo criado **pela interface** da Ichthus e mesmo recibo/ACK em ambos os bancos antes de usar Meta.
6. Após o transporte, a autorização do WhatsApp ocorrerá em onboarding assistido da Proxy **vinculado ao protocolo**, seguindo ADR Proxy #40; não abrir Embedded Signup direto no CRM.

Não fazer merge indiscriminado dos PRs G2 sobre `main`. Não marcar WhatsApp como conectado só porque o protocolo foi recebido. Não reusar um banco/test tenant ou conta Meta de outro cliente.
