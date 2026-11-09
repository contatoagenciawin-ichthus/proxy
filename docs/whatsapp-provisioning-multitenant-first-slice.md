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


## Incremento seguinte — 09/11/2026
- Store transacional `lib/meta-provisioning/provisioning-store.mjs`:
  recebe somente recibos reais, trava identificação de operador, emite sessão OAuth
  de uso único com nonce apenas hasheado no banco e validade de dez minutos.
  WABA e Phone Number ID esperados são opcionais para futuros tenants; quando
  informados, o retorno precisa coincidir.
- Writer isolado `lib/meta-provisioning/credential-writer.mjs`:
  recebe token apenas de fluxo Graph validado, verifica consentimento consumido,
  autentica organização, protocolo, operador e ativos, insere envelope cifrado,
  atualiza fase e audita fingerprint em uma transação.
- Definidas permissões mínimas de roles no SQL separado
  `migrations/20261109_proxy_provisioning_role_grants.sql` (NÃO aplicado).
  O runtime deve ser incapaz de ler/inserir envelopes. O writer pode somente
  inserir envelopes, sem SELECT/UPDATE/DELETE.
- Github Actions `.github/workflows/meta-provisioning-verify.yml` executa
  testes de isolamento, rejeição de escalada e criptografia. CI passou em
  `2955e0cf7e3e4cf76a3bc84c4836895e0f0d6cbc`.
- Migração base foi validada em branch temporária Neon
  `br-wild-haze-b59o0cgk` por preparação da ferramenta. Essa branch está
  isolada da produção. Após esse teste, a DDL foi refinada para permitir
  descoberta de WABA/número sem IDs prévios; requer revalidação antes de aplicar.
- Ainda NÃO implementado: callback OAuth autenticado com a sessão GitHub
  real, Graph client que valida token/escopos/negócio, endpoint interno de
  uso do cofre e diagnóstico baseado na credencial, comunicação de estados ao
  CRM, atribuição e auditoria operacional final.
- Nenhuma migração em produção, role ou secret de runtime habilitado,
  deploy de onboarding novo ou acesso a WABA atual. Esta entrega **não ativa
  o WhatsApp do CRM**.

## Aprovação de produção
Para aplicar migrations, criar roles dedicadas e provisionar a chave de
criptografia de plataforma, é necessária revisão de segurança e aprovação
operacional explícita. Não pedir credenciais por chat nem provisionar
valores por cliente na Vercel.


## Incremento de segurança — 09/11/2026 (finalização OAuth, sem endpoint público)
- `meta-authorization-verifier.mjs`: valida servidor-servidor app ID,
  validade/escopos do token, WABA e pertencimento do número usando Meta Graph
  API; sanitiza erros e falha fechado com paginação incompleta.
  A troca real via Graph ainda não foi ensaiada com credencial operacional.
- `meta-authorization-finalize.mjs`: primeiro consulta sessão do operador e
  protocolo com hash de nonce, depois troca o código Meta e só encaminha
  dados verificados ao writer do cofre. Não existe rota HTTP para disparar isso.
- `provisioning-store.mjs`: `checkAuthorization` é somente leitura. O
  método anterior de consumo isolado foi retirado, para não queimar a sessão
  sem guardar o token.
- `credential-writer.mjs`: consumo do nonce de uso único, inserção cifrada,
  transição do provisionamento e evento de auditoria agora compartilham **uma
  única transação**. Falha do writer reverte também consumo do nonce.
  É necessário um papel DB com UPDATE na tabela de sessões, mas **sem**
  SELECT/UPDATE/DELETE no cofre.
- Migração também prevê unicidade global de Phone Number ID não revogado
  para evitar provisionamento concorrente do mesmo número a tenants distintos.
- CI de segurança da branch passou no commit
  `9db7a994063cbbf2f01495d134dcf0c17b1eb9fd`.

### Bloqueios antes de executar Meta de verdade
1. Revisar e aplicar esquema + grants em ambiente de testes; testar roles reais e RLS.
2. Criar endpoint administrativo autenticado + proteção CSRF, vinculado a
   protocolo existente, usando origem e operador verificados pelo servidor;
   bloquear acesso direto pelo onboarding legado.
3. Validar o contrato **real** de troca de código no Graph v26 e retorno
   de eventos da configuração de coexistência, com proteção contra múltiplas
   execuções, concorrência e callbacks inesperados.
4. Provisionar uma chave-mestra versionada da **plataforma**, não de clientes,
   com plano de rotação/recuperação; separar papel que lê o token do que o grava.
5. Encadear diagnóstico de somente leitura PR #51 e atualizar status no CRM,
   sem marcar como operacional antes dos testes de mensagem.

**Não executar Embedded Signup novamente, não mexer em webhook global,
não abrir sessão Meta com código anterior, não alterar WABA de LA/Eduardo.**
