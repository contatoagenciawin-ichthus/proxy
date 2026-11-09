# G2 — Pré-validação de coexistência Meta da Ichthus (22/10/2026)

**Objetivo da autorização do proprietário:** iniciar apenas inspeção autenticada dos ativos Meta e elegibilidade de coexistência do número +55 19 99805-6642 (Ichthus Marketing). Não inclui reconectar, desconectar aplicativo, trocar token, assinar webhook, ativar produção ou mandar mensagens.

## Resultados efetivamente verificados

1. Repositório Proxy branch de G2 contém a página `app/meta/onboarding/coexistence/page.tsx` com app ID `1952034255371331` e configuração `3237839906603757`. A página antiga utiliza `/api/meta/onboarding/exchange` para troca de token e handoff.
2. **Risco de ordem de callbacks na página antiga:** ao receber `authResponse.code`, a UI marca `embeddedSignupCompleted: true` e `embeddedSignupEvent: "AUTHORIZATION_CODE"` sem exigir confirmação separada de `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`. O evento de código, sozinho, não demonstra coexistência concluída. Não reiniciar o fluxo legado para obter credenciais da Ichthus.
3. O fluxo mais restrito `lib/ichthus-proxy-oauth-controller.mjs` permanece sem rota HTTP operacional e sem verificação ponta a ponta do vínculo código/estado/callback Meta; é **STAGED**.
4. `lib/meta-review.ts` mantém defaults de **outro conjunto de ativos Meta**, incluindo WABA e phone distintos dos identificadores previstos para Ichthus. Portanto, não usar `/api/meta/review/*` como prova de existência/estado do número Ichthus.
5. As variáveis Vercel da Proxy mostram nomes de credenciais de revisão `META_REVIEW_ACCESS_TOKEN` em alguns ambientes, mas esse inventário **não confirma escopos, validade, acesso ao WABA Ichthus ou status de coexistência**. Nenhum segredo foi decriptado, registrado ou colocado no frontend.
6. A conexão Meta específica da Ichthus continua sem credencial operacional persistida na tabela `relationship.meta_channel_credentials` do Neon de desenvolvimento, conforme auditoria de leitura da rodada anterior.
7. Os dados históricos esperados para conferência são WABA `107697061976892` e phone ID `107612478652254`. **Ambos exigem confirmação na Graph API com token autorizado para Ichthus; não assumir apenas porque constam na documentação do projeto.**

## Validação autenticada ainda necessária (read-only)

- Entrar na **BM Ichthus Marketing** com sessão autorizada e conferir titularidade do WhatsApp Business Account e número exibido.
- Verificar no Graph API (com **token de cliente do tenant**, sem exibição do token): `GET /<WABA_ID>?fields=id,name,owner_business_info`, `GET /<WABA_ID>/phone_numbers?fields=id,display_phone_number,status,platform_type` e `GET /<WABA_ID>/subscribed_apps`, respeitando Graph API versionada e permissões reais.
- Inspecionar app e config de Embedded Signup *sem lançar o fluxo novamente* e verificar que a opção de coexistência está disponível, incluindo documentação atual e permissões; verificar configuração de eventos `messages`, `history`, `smb_message_echoes` e `smb_app_state_sync` antes de qualquer conexão.
- Associar resultados a evidências observáveis sem revelar tokens, conteúdo de mensagens ou dados pessoais.
- **Resultado atual:** não validado na Graph API. As ferramentas conectadas nesta sessão oferecem GitHub/Vercel/Neon, mas não uma sessão administrativa direta da Meta/Graph para executar essas leituras de modo autenticado.

## Decisão de segurança

Não usar os defaults da console Meta Review ou uma credencial genérica de outro cliente para declarar Ichthus ativo. Não atualizar o webhook de app compartilhado ou fazer re-onboarding em conta já conectada. Próxima etapa deve usar sessão administrativa na Meta (por navegação autenticada em Work ou evidência visual autorizada) e confirmar os três objetos; caso contrário, manter canais Meta desligados.
