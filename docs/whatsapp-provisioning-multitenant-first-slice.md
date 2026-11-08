# Proxy · Provisionamento WhatsApp reutilizável (primeiro incremento)
Status: **Draft — não implantado nem conectado a OAuth produtivo**. Data: 2026-11-08.

## Decisão comercial
**Nenhuma WABA, phone number ID, endpoint ou token Meta por variável de ambiente do cliente.**
Organizações, protocolos, vínculos e estados residem no banco central. O operador
não abre Vercel para cada integração. Somente configuração estável de plataforma
(Meta App ID/secret, DB runtime roles, master key versionada, OAuth settings) pertence
ao ambiente. A Proxy conserva credenciais Meta cifradas; o CRM recebe somente
estados e mensagens por contratos autenticados, não tokens.

## Implementado nesta branch
- Schema novo, ainda não aplicado, referenciando recibos reais no
  `proxy_control.connection_requests`, com RLS FORCE, organização composta
  em FK de envelope e auditoria, e sem GRANT para credenciais.
- AES-256-GCM com IV aleatório, AAD de organização + protocolo + WABA + número +
  Meta App ID; master key apenas no backend da plataforma e fingerprint sem
  exposição de token. Troca de chave por versão planejada, não implementada.
- Funções puras que impedem troca de ativos/protocolo, saltos de estado e
  ativação antes de validação real de inbound, resposta, callback e isolamento.
- Testes de rejeição cross-tenant, adulteração de envelope e transições inválidas.

## Dependências que ainda bloqueiam produção
1. Aprovar DB migration em staging, roles de acesso separados, isolamento RLS
   e grants mínimos; o schema legado `core.*` **não tem FORCE RLS** e não
   deve ser tomado como cofre operacional sem remediação.
2. Implementar DB writer transacional, validando existência do protocolo,
   organização e produto a partir de registros server-side, nunca da URL/cliente.
   Resolver cardinalidade tenant 1:N WABAs/números e conflito de ativos.
3. Implementar OAuth authorization state de uso único e curta duração
   ligado à sessão autenticada do operador + protocolo + identidade dos ativos;
   validação dos eventos recebidos deve proteger contra mensagens de janela
   fora de contexto; nunca colocar credencial OAuth em sessionStorage.
4. Transação de guarda de token: validar Meta app, escopos, WABA, número,
   inscrição do app e credencial de backend; selar e persistir; auditar somente
   fingerprint; retry de código consumido não deve fazer outra troca.
5. Confirmar propriedade e segregação da credencial e da assinatura webhook,
   validar idempotência, callback, CRM e isolamento via testes E2E.
6. Definir procedimento documentado de rotação da chave de plataforma,
   backup e recuperação; nunca registrar key ou accessToken em log.
7. Conectar PR #51 ao cofre com função de leitura escopada para
   diagnóstico, não usar `META_REVIEW_WHATSAPP_ACCESS_TOKEN`.

## Rollout
**Não faça merge/deploy automático.** Primeiro integração e isolamento no
ambiente descartável; depois migração aprovada, roles estritas, testes de
interação e nova autorização Meta apenas quando o receptor estiver pronto.

## Primeiro caso
Ichthus org `e9b935b6-3349-4b2c-970d-be8ad3bc243d`, protocolo
`6419a70f-854d-4b7f-989a-25beaadabeed`; números históricos coincidiram
com retorno do Embedded Signup em 2026-11-08. A Meta autorizou o app mas o
handoff falhou antes de guardar token; estado **não operacional**.

## Limites desta entrega
Nenhuma operação Meta, alteração de assinatura, mudança no webhook global,
reconfiguração da LA/Eduardo, nova IA, migração de número, mudanças na Vercel
ou gravação no Neon. Esta branch entrega somente o cofre criptográfico e
contratos de provisionamento que habilitam a próxima integração segura.
