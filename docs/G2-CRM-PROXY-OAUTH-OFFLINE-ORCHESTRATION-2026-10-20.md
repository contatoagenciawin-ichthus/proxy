# G2 — Orquestração isolada CRM → Proxy → Meta simulada (20/10/2026)

**Status:** código e testes somente no PR #19 draft. Nenhum endpoint HTTP implementado/ativado, nenhuma Graph API real, nenhum token real ou mudança de webhook.

## Novo componente

- `lib/ichthus-proxy-oauth-orchestrator.mjs`: função pura com adaptadores injetados que valida o ticket assinado do CRM e exige que `consumeOnce` confirme o consumo único no backend Proxy **antes** de chamar o callback fictício `exchangeCode`.
- A resposta é restrita a confirmação e identificadores de ativo; nunca contém código de autorização nem token Meta. O callback é uma função server-only injetada e **não constitui um serviço Meta implementado**.
- `tests/ichthus-proxy-oauth-orchestrator.test.mjs`: confirma ordem consumo→troca, 15 chamadas simultâneas (uma única troca simulada), negação de tenant/config/expiração/código inválido/ausência do ledger e retenção de consumo após falha do prestador. Falha de troca não devolve o ticket ao estoque; exige novo Embedded Signup.

## Limites de segurança que impedem conexão real

1. O controller de produção deve autenticar origem server-to-server da **sessão e do tenant Ichthus**, sem confiar em payload arbitrário do navegador; o ticket assinado por si só não prova vínculo criptográfico do **código específico** ao fluxo aprovado.
2. O par WABA/Phone Number ID deve ser confirmado **após** troca real na Graph API, por verificação do acesso aos ativos; nunca confiar apenas no corpo recebido.
3. O receptor de credenciais do CRM deve usar handoff verificado, cifrado e RLS, não um retorno direto ao navegador. Não alterar a rota legada `/api/meta/onboarding/exchange` de Eduardo.
4. O login PostgreSQL de homologação no Neon é restrito e autenticado por consulta, mas seu segredo temporário não foi instalado no Vercel/CI, nem o driver `pg` adicionado ao runtime central. Os testes de banco real do CI permanecem no PostgreSQL descartável.
5. Implementação de callback OAuth, Graph API e webhook depende de homologação isolada e autorização explícita posterior. Não reexecutar código OAuth antigo.

**Não considerar G2 encerrado nem conexão operacional.** Esses testes confirmam apenas a ordem e a idempotência da simulação offline.
