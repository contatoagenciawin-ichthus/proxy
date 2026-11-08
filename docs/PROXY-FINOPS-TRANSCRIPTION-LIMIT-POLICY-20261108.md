# FinOps — limite técnico de transcrição e separação comercial (08/11/2026)
Estado: decisão arquitetural aprovada; desenho para aplicação futura. Sem alteração operacional, credencial, migração ou deploy.
Referências: Proxy #46, PR #48, LA #74.

## Regra principal
O ajuste de orçamento de transcrição via CRM Proxy é **autorização interna de exposição operacional**. Não equivale a venda, crédito comercial, saldo pré-pago nem promessa de minutos de transcrição. Nunca expor ao dono/admin/operador do tenant: soft limit em BRL, tolerância, custo por minuto, modelo, FX, tokens, margens, nem detalhes de reconciliação, inclusive por APIs/logs acessíveis ao tenant.

Uma eventual política comercial de upgrades, pacotes de serviço ou cobrança será criada e aprovada separadamente. Nenhuma cobrança automática ou frase "adicione R$ X de crédito" deve ser gerada com base neste orçamento.

## Comando inicial prioritário
`set_transcription_monthly_limit` altera o limite **total autorizado da competência**, em centavos BRL, não o incremento de limite.

Exemplo LA (hipotético, não executar): limite atual `3000` (R$ 30), novo limite `5000` (R$ 50). A diferença `2000` (R$ 20) é apenas variação da exposição autorizada, não faturamento, pacote comprado ou receita.

Campos mínimos tipados do pedido (envelope será assinado pelo mecanismo do control plane):
- `commandId`: UUID único e idempotente
- `tenantId`: UUID canônico Proxy
- `externalOrganizationId`: UUID verificado no tenant
- `sourceSystem`: namespace `la-crm` no piloto
- `service`: `whatsapp_audio_transcription`
- `operation`: `set_transcription_monthly_limit`
- `competence`: `YYYY-MM`, timezone `America/Sao_Paulo`
- `newSoftLimitCents`: inteiro de centavos do teto total da competência, sem ponto flutuante
- `expectedPolicyVersion`, `newPolicyVersion`: controle de concorrência e replays
- `reason`, `actorId`, `issuedAt`, `expiresAt`: trilha e prazo

A mudança é absoluta; repetição do mesmo comando deve retornar o resultado original, nunca somar R$ 20 novamente. Mudanças após início da competência devem respeitar consumo já reservado. Redução abaixo do gasto não apaga ledger; apenas impede novas reservas. Nenhum aumento aplicado antes do acknowledgement da política efetiva no tenant.

## Aplicação segura
- Admin Proxy habilitado em `finops_manage`, com autorização por tenant e serviço, pode emitir comando; papel `finops_read` não pode.
- Tenant valida assinatura, `commandId`, vínculo, audiência, operação, versão esperada, competência, prazo, campos permitidos e limites técnicos; aplica em transação local e retorna versão aplicada.
- Reserva de áudio permanece local/atômica, com bloqueio no soft limit sem consumir tolerância, sem chamar Proxy por mensagem.
- A tolerância `tolerance_cents` tem ciclo administrativo distinto. Não cresce automaticamente ao aumentar `soft_limit_cents`; não deve liberar transcrições acima do limite.
- Versão inicial suporta somente mês corrente se a implementação LA mantiver a RPC de reserva atual. Mudanças retroativas ou futura competência exigem evolução explícita do schema e testes; não prometer suporte histórico que não existe.
- O schema LA atual impõe `soft_limit_cents between 100 and 1000000`; o contrato da Proxy deve validar limites reais do tenant, sem extrapolar.
- O orçamento é estimativa em BRL com FX prudencial. A elegibilidade para chamar OpenAI não equivale a cobrança final conciliada.

## UX interna do CRM Proxy
Mostrar: tenant, serviço, mês São Paulo, versão, teto atual, uso estimado, gasto reservado/incerto quando disponível, novo teto exato em centavos, diferença, justificativa, operador, status `requested/pending/applied/rejected/reconciliation_required`, data de confirmação e trilha de alterações.
Não mostrar valor aplicado como sucesso antes de confirmação. Painel do tenant não deve conter referências a valores ou internos, nem campos escondidos em respostas JSON.

## Verificações
Casos: R$ 30 → R$ 50; retry idempotente; concorrência de versões; redução abaixo do gasto; rejeição tenant errado; payload com campos inesperados; usuário sem autorização; competência inválida; valor fracionário/negativo; comando expirado; ausência de confirmação; não ampliação da tolerância; ausência de vazamento em API/UI tenant.

## Escopo deste documento
Decisão e requisitos para o contrato bidirecional. Não habilita escrita direta em `whatsapp_audio_budgets`, não entrega credenciais Supabase da LA à Proxy e não altera produção. Implementar o canal de escrita somente após homologação de uma interface de comando com privilégio mínimo.
