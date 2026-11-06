# Proxy G2 — Leitura administrativa independente da recepção

Estado: **Draft / Preview desativado por padrão**. Nenhum webhook Meta, WABA, número ou fluxo de produção foi alterado.

## Decisão de isolamento

A interface administrativa não deve precisar de `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=true` para consultar solicitações. A rota de recebimento HMAC do CRM é uma capacidade distinta da leitura do operador.

Na branch `feat/g2-admin-read-isolation-20261106`, `PROXY_REQUEST_ADMIN_READ_ENABLED=true` habilitará apenas o leitor dedicado. A recepção permanece desativada. O fluxo de escrita administrativa requer, adicionalmente, `PROXY_REQUEST_WORKFLOW_ENABLED=true`; a role de escrita segue separada do leitor.

As duas conexões apontam para **o mesmo banco Neon filho**, nunca para bancos ou tenants distintos:
- Neon project `falling-mouse-74404571`, branch `br-hidden-voice-b62ms74u`, database `proxy_g2_homolog`
- leitor `proxy_connection_admin_reader_login`: SELECT apenas em `proxy_control.connection_requests`; sem INSERT/UPDATE de recibos, sem SELECT/UPDATE de workflow e sem vínculo às roles `proxy_connection_receiver_restricted` ou `proxy_connection_workflow_operator`
- operador `proxy_connection_workflow_preview_login`: permissão de escrita apenas nas tabelas de workflow, leitura dos recibos, sem INSERT no recibo original
- ambas as transações usam `app.organization_id` e tabelas com FORCE RLS.

## Provas SQL já realizadas

Com login real do leitor, uma transação com escopo `55555555-5555-4555-8555-555555555555` retornou 1 recibo do tenant fictício. Escopo `11111111-1111-4111-8111-111111111111` não retornou o protocolo `7777...`. Sem escopo retornou 0. A role não tem privilégios de escrita nos recibos.

## Vercel

Foram cadastradas **somente na branch Preview deste PR** as variáveis sensíveis `PROXY_REQUEST_ADMIN_READ_DATABASE_URL` e `PROXY_REQUEST_WORKFLOW_DATABASE_URL`; as flags `PROXY_REQUEST_ADMIN_READ_ENABLED=false`, `PROXY_REQUEST_WORKFLOW_ENABLED=false`, `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=false`, e allowlist exclusiva da organização fictícia. Nenhuma variável foi promovida a Production.

## Impedimento antes do teste visual

O novo Preview **não possui configuração de autenticação GitHub/Proxy específica já confirmada**. Antes de ativar flags ou expor um painel, é necessário confirmar o callback/redirect URI autorizado do app OAuth, a origem exata do Preview e credenciais OAuth restritas ao fluxo de homologação. Não importar ou modificar automaticamente credenciais de produção, nem relaxar a checagem `PROXY_ADMIN_ORIGIN`. Um build READY não equivale a um login administrativo validado.

A homologação visual ainda precisa verificar que o administrador autenticado abre `7777...`, lê a versão 3, registra um novo evento e recebe erro 409 ao usar versão antiga, retornando os gates a `false` em seguida.
