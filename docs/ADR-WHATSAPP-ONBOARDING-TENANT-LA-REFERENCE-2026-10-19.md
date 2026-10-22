# ADR — Conexões WhatsApp de novos clientes: referência LA Climatização

**Decisão arquitetural / referência obrigatória para G2 e futuras integrações WhatsApp do ecossistema Proxy.**
**Registrada em:** 19/10/2026. **Status:** diretriz de análise e desenho; não equivale a homologação atual da conexão LA nem a autorização de mudança de produção.

## Decisão

**Antes de implementar a conexão de um novo cliente, estudar primeiro o fluxo já implementado na Marc.I.A. da LA Climatização.** Ele é a referência principal de processo e isolamento tenant-owned; Eduardo Brasil é referência complementar/histórica, não o modelo obrigatório de entrada. Não copiar cegamente nenhum dos dois: validar na Meta a configuração e o estado real dos ativos de cada cliente.

A LA usa o mesmo Meta Tech Provider App **Proxy Whapp Platform** (App ID `1952034255371331`), mas dispõe de uma página de prontidão autenticada no próprio produto, um Embedded Signup local, troca OAuth pelo servidor do tenant, armazenamento no Supabase Vault e verificação/assinatura específica do webhook. A Ichthus iniciou por outra página central, cujo backend possui um registro de handoff de Eduardo: essa diferença explica a falha de roteamento de credenciais observada e exige reconsideração da arquitetura antes de repetir o onboarding.

## Referências primárias: LA Climatização

**Repositório:** [Marc.I.A. / LA CRM](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm), branch `main`.

| Etapa | URL do produto / arquivo de implementação | O que verificar |
| --- | --- | --- |
| Painel do tenant e início seguro | [https://app.laclimatizacao.com.br/whatsapp/readiness](https://app.laclimatizacao.com.br/whatsapp/readiness) · [readiness/page.tsx](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/app/whatsapp/readiness/page.tsx) | Login owner/admin, conexão pré-cadastrada, credencial no Vault, Graph phone/WABA e subscription |
| Formulário Embedded Signup | [whatsapp-embedded-signup.tsx](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/components/whatsapp-embedded-signup.tsx) | SDK Facebook, `FB.login`, `config_id`, `response_type=code`, coexistência `whatsapp_business_app_onboarding`, evento `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` |
| Configuração Meta | `META_WHATSAPP_CONFIG_ID` utilizada no [readiness/page.tsx](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/app/whatsapp/readiness/page.tsx) | **Valor efetivo do `config_id` da LA ainda não foi confirmado.** Não presumir que coincide com `3237839906603757` da página central |
| Conclusão server-side | [POST /api/whatsapp/embedded-signup/complete](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/app/api/whatsapp/embedded-signup/complete/route.ts) | Owner/admin, WABA+phone_id correspondem à conexão cadastrada, OAuth code → token, Graph confirma ativos |
| Token por conexão | [credentials.server.ts](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/lib/whatsapp/credentials.server.ts) · [Vault migration](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/supabase/migrations/20260921145704_whatsapp_tenant_vault_credentials.sql) | `set_whatsapp_connection_access_token`; segredo tenant-owned no Supabase Vault, nunca no browser |
| Ativação e verificação por WABA | [POST /api/whatsapp/activate-webhook](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/app/api/whatsapp/activate-webhook/route.ts) | Inscrição `/{waba_id}/subscribed_apps` e **`override_callback_uri` por WABA**, sem alterar callback global |
| Endpoint receptor de eventos | [https://app.laclimatizacao.com.br/api/whatsapp/webhook](https://app.laclimatizacao.com.br/api/whatsapp/webhook) · [webhook/route.ts](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/src/app/api/whatsapp/webhook/route.ts) | Verificação de assinatura, roteamento por `phone_number_id`, conversa, mensagens, deduplicação |
| Arquitetura | [docs/whatsapp-architecture-marcia.md](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/docs/whatsapp-architecture-marcia.md) | Tenant owns business/WABA/number; Proxy owns Tech Provider App; IA aciona actions autorizadas |
| Evidência histórica | [docs/whatsapp-operator-quote-pilot.md](https://github.com/contatoagenciawin-ichthus/contatoagenciawin-ichthus-la-crm/blob/main/docs/whatsapp-operator-quote-pilot.md) | Documento de 02/10 registra LA conectada, webhook verificado e automação ativa; **não é consulta em tempo real** |

## Referências secundárias: Eduardo e rota central Proxy

- [Página central de coexistência](https://proxy.ichthusmkt.com.br/meta/onboarding/coexistence) · [fonte](https://github.com/contatoagenciawin-ichthus/proxy/blob/main/app/meta/onboarding/coexistence/page.tsx). Usa um `config_id` definido na própria página; troca a autorização via `POST /api/meta/onboarding/exchange`.
- [Backend central de troca/handoff](https://github.com/contatoagenciawin-ichthus/proxy/blob/main/app/api/meta/onboarding/exchange/route.ts): implementação histórica reconhecia o destino Eduardo; a tentativa da Ichthus retornou **403** por ativo não cadastrado no roteador de handoff.
- [Proxy PR #19](https://github.com/contatoagenciawin-ichthus/proxy/pull/19) e [Proxy CRM PR #10](https://github.com/contatoagenciawin-ichthus/proxy-relationship-demo/pull/10): trabalho de handoff criptografado desenvolvido para Ichthus, **mantido em draft/desativado enquanto se decide se a camada central é necessária**.
- Não alterar a integração Eduardo nem a LA por causa dessa revisão.

## Checklist obrigatório para um terceiro, quarto e próximos clientes

1. **Inventariar o tenant**: organização, proprietário do Business Portfolio, WABA, Phone Number ID, número, estado do WhatsApp Business App e intenção de **coexistência** ou migração. Não inferir que todos os números possuem a mesma modalidade.
2. **Conferir na Meta** o aplicativo Tech Provider, permissões, o **config_id real e autorizado para o caso**, SDK/eventos compatíveis e requisitos vigentes; registrar evidência. Nunca reutilizar `config_id` de outro fluxo por conveniência.
3. **Escolher onboarding por tenant no próprio CRM/produto como padrão inicial de arquitetura**, com autenticação owner/admin, ligação antecipada entre organização e ativo, validação de WABA e Phone Number ID e troca de código server-side. Considerar handoff central apenas com justificativa técnica explícita e testes.
4. **Guardar token tenant-owned no backend**: Supabase Vault quando for o armazenamento canônico do cliente (LA); no Proxy CRM/Neon, armazenamento cifrado com RLS e papel restrito. O browser e a IA não recebem tokens.
5. **Separar assinatura WABA da configuração global Meta**: validar `/{waba_id}/subscribed_apps`, configurar callback exclusivo por WABA quando permitido, confirmar retorno e não modificar o callback global nem outras WABAs.
6. **Homologar antes de declarar conectado**: credencial verificável, WABA/phone_id, subscription, callback, evento inbound recebido, deduplicação, roteamento tenant e resposta humana consentida. Distinção explícita entre “Meta concluiu coexistência” e “backend armazenou credencial/conexão operacional”.
7. **Não habilitar automação/IA/outbound por default**: ativar somente após gates funcionais, consentimento, auditabilidade e controles de atendimento.
8. **Registrar numa ficha por cliente**: URLs de onboarding, painel de prontidão, callback, app/config ID, IDs WABA/phone, ambiente e datas de teste, evidências sanitizadas, responsável e rollback. **Não registrar segredos.**

## Decisão específica Ichthus (pendente)

- **Não reiniciar o Embedded Signup** e não ativar handoff dos PRs #19/#10 antes da revisão de arquitetura.
- Verificar primeiro o `config_id` da LA e a configuração Meta correspondente sem expor segredos; distinguir o fluxo de coexistência do fluxo genérico da página central.
- Avaliar implementação da jornada diretamente no Proxy CRM, usando o modelo LA de verificação/autorização por tenant e reaproveitando as proteções Neon já construídas.
- Confirmar pela Meta, de modo somente leitura, o estado dos ativos Ichthus; não presumir que onboarding concluído signifique token persistido.
- A LA está documentada como operacional em outubro, mas a conexão atual requer evidência de consulta autenticada, não apenas código ou relatório passado.

## Regra de governança

Em qualquer nova solicitação “conectar WhatsApp do cliente X”, **abrir este ADR e as referências da LA antes de desenvolver, sugerir URL ou solicitar reinício de onboarding**. Se for proposto desvio, explicitar qual requisito da LA não se aplica e quem aprovou a exceção. A implementação Meta é separada dos poderes comerciais da IA/CRM.
