# G2 — Vinculação da requisição server-to-server (20/10/2026)

**Status:** protocolo e testes inativos, apenas nos PRs draft. Nenhuma rota HTTP conectada, nenhuma troca Meta executada.

## Implementação

- CRM: `lib/relationship/ichthus-proxy-oauth-request-binding.mjs` emite envelope HMAC exclusivo de transporte, com audience `proxy-tech-provider:ichthus:oauth-request:v1`, validade de 60 segundos, `requestId` e SHA-256 do ticket autorizado e do código OAuth.
- Proxy: `lib/ichthus-proxy-oauth-request-binding.mjs` verifica assinatura, formato canônico, prazo e correspondência exata dos digests.
- Proxy: `lib/ichthus-proxy-bound-exchange.mjs` exige verificação do envelope **antes** de chamar a proteção de replay e antes da função externa de troca simulada.
- Usa segredo dedicado de requisição CRM→Proxy, **diferente** dos segredos da Meta, do state e do ticket; não transmite código ou ticket no próprio envelope. Requisição HTTP futura deverá transportar o código exclusivamente entre serviços por TLS e não registrar payloads sensíveis em log.
- Testes em ambos os PRs demonstram negação de código alterado, ticket diferente, assinatura errada e expiração; controle de consumo único continua obrigatório e testado separadamente.

## Limites e gate crítico

**Este envelope prova integridade do pedido assinado pelo servidor CRM; NÃO prova que o código OAuth específico tenha sido realmente emitido pela Meta para a sessão, state ou config.** Essa vinculação exige revisar o comportamento real do Meta Embedded Signup, validar seu fluxo CSRF/session e confirmar via troca Graph no backend central. Não alegar vínculo Meta→state antes desses testes.

O servidor deve obter ator e tenant de Better Auth, e só assinar após consumo de state confirmado em transação. O endpoint Proxy deve verificar autenticação serviço-a-serviço, ticket, envelope e replay, mesmo que um código seja assinado; nenhuma destas funções autoriza browser direto. Falha de troca exige novo código Meta e não pode resetar ledger.

Nem `pg.Pool` da Proxy foi ligado à branch Neon, nem Vercel/produção foi configurada, nem a conexão WhatsApp Ichthus foi ativada. As conexões Eduardo e LA permanecem intocadas.
