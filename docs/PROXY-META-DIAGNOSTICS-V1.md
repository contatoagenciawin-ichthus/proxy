# Diagnóstico administrativo Proxy · contrato v1

Status: implementação de desenvolvimento, coleta real desabilitada por padrão.
Data: 23/10/2026. Nenhuma migration ou alteração de webhook é necessária nesta etapa.

## Fronteira

O produto fornece somente metadados locais à administração Proxy. Nenhum token Meta,
segredo, conteúdo de conversa, contato, payload bruto, fingerprint ou ID do Vault
é retornado. Nenhuma função de descriptografia é chamada. Todas as consultas são
SELECTs; não há Graph API, envio de mensagem, signup, registro, rotação ou assinatura.
A credencial `recorded` significa somente registro local existente. Não comprova uso.
Coexistência permanece `undetermined`; a assinatura/callback Meta não é consultada.

## Endpoint e autorização

`GET /api/proxy/diagnostics` tem gate `VERCEL_ENV=production` e
`PROXY_DIAGNOSTICS_ENABLED=true`. Ausência/configuração inválida responde 404,
antes de criar o cliente de banco. Preview e development não leem dados reais,
mesmo com as demais variáveis preenchidas. HEAD responde 405 sem coletar.
Cookies de CRM, Origin, query strings e pedidos sem HMAC são recusados antes do banco.
O HMAC-SHA256 usa chave dedicada por produto, diferente do App Secret Meta, e assina
versão, método, path, cliente, organização, conexão, WABA, número, timestamp e nonce.
Comparação em tempo constante; janela de relógio de 60 segundos. O nonce não é
persistido: replay de uma requisição capturada dentro dessa janela pode repetir a
mesma leitura. TLS e chave dedicada são obrigatórios. Não há autorização de escrita.
Não registrar cabeçalhos de assinatura nem chaves em logs.

Todas as respostas usam no-store. Erros retornam categorias fixas sem detalhes do banco.
O consumidor rejeita campos fora do contrato, identidades divergentes, datas inválidas,
coleta com mais de cinco minutos, resposta excessiva ou indicação falsa de consulta Meta.

## Configuração futura do produto (não aplicada)

- `PROXY_DIAGNOSTICS_ENABLED`: manter ausente/false até liberação.
- `PROXY_DIAGNOSTICS_SECRET`: chave dedicada deste produto, 32 a 256 caracteres,
  cadastrada somente server-side, nunca em NEXT_PUBLIC e nunca reaproveitada da Meta.
- `PROXY_DIAGNOSTICS_CONNECTION_ID`: UUID da conexão local autorizada.
- `PROXY_DIAGNOSTICS_WABA_ID` e `PROXY_DIAGNOSTICS_PHONE_NUMBER_ID`: ativos esperados.
- Apenas LA: `PROXY_DIAGNOSTICS_ORGANIZATION_ID`, UUID exato da organização.

O vínculo é explícito, não inferido da primeira organização/conexão. O consumidor
precisa da mesma chave e dos mesmos identificadores. Não gerar ou cadastrar chaves
como parte desta revisão; ativação é uma etapa operacional posterior.

## Fontes e limites

LA: `whatsapp_connections` pelo ID e organization_id; presença de referência de
credencial em `whatsapp_connection_secrets` por filtro não nulo, sem ler o valor
ou acessar Vault; `whatsapp_webhook_events` pela mesma conexão/organização.
`last_webhook_at` é recebimento de um payload reconhecido, atualizado antes de
terminar o processamento. `processed_at` exige `processing_status=processed`.
Falhas contam registros `failed` em 24 horas, teto 100 (exibir “pelo menos”).
Falhas anteriores à gravação de evento não estão cobertas. A rota de prontidão
existente e seus botões operacionais não são reutilizados.

Eduardo: `whatsapp_phone_numbers` por UUID com conferência de WABA/número;
`whatsapp_meta_credentials` seleciona apenas expires_at e scopes, por WABA/número.
Eventos filtram no banco a expressão
`payload->entry->0->changes->0->value->metadata->>phone_number_id`.
A ingestão atual não preenche phone_number_id na linha de evento. Portanto a
cobertura é parcial: apenas o primeiro item de cada lote. Não exportar nem percorrer
payloads no painel para contornar essa lacuna. Processamento exige processed_at não
nulo e processing_error nulo; falhas registradas em 24 horas têm teto 100.
Eventos de lotes sem esse metadado podem não aparecer. HTTP 200 do webhook não
é prova de processamento bem-sucedido. A saúde local não é validação na Meta.

Leituras têm limite de linhas e timeout de 4 segundos por consulta. O filtro JSON
legado do Eduardo pode exigir varredura; limite de linhas não limita custo de scan.
Validar plano/volume e eventual índice ou vínculo estrutural antes de habilitar
monitoramento frequente. Este PR não aplica schema/índices nem altera ingestão.
Não há polling, cron ou consulta de todos os clientes ao abrir a listagem.

## Verificação e liberação

Testes usam somente dados sintéticos e módulos de banco substituídos. Cobrem HMAC,
binding entre clientes, recusa antes do banco, modo disabled/preview, projeção,
falhas, expiração, cobertura parcial, adaptadores reais das rotas TypeScript e HEAD.
Não executar teste contra credenciais reais para aprovar este PR.

Antes de ativar: revisar PRs, conferir os IDs por consulta autorizada, confirmar
schema de produção sem expor dados, avaliar custo das consultas, configurar chaves
server-side por produto e aprovar deploy/liberação individual. Validar primeiro uma
conexão. Conferir metadados contra a interface do produto. Rollback: desabilitar a
coleta no central ou o endpoint no produto, sem tocar na conexão Meta.

## Consumidor no painel Proxy

A consulta ocorre exclusivamente no servidor, após validação da sessão e allowlist
de administrador da plataforma, ao abrir uma ficha. Não existe API pública de resumo.
Os destinos são fixos no código: app.laclimatizacao.com.br e
eduardobrasil.fonsecabrasilserrao.com. Não aceitar URLs do navegador ou redirects.
Timeout de 6s; corpo máximo de 8 KiB; cache no-store. Respostas indisponíveis,
recusadas ou inválidas não substituem o inventário e não aparecem como saudáveis.
Ichthus continua sem adaptador, até sua conexão ser homologada separadamente.

Configuração futura somente no servidor (não aplicada):
`PROXY_DIAGNOSTICS_COLLECTION_ENABLED=true` e `VERCEL_ENV=production`.
Para cada prefixo `PROXY_DIAGNOSTICS_LA_` ou `PROXY_DIAGNOSTICS_EDUARDO_`:
`ENABLED=true`, `SECRET`, `CONNECTION_ID`, `WABA_ID`, `PHONE_NUMBER_ID`;
apenas LA também `ORGANIZATION_ID`. A chave deve corresponder ao produto.
O Eduardo ainda exige os IDs já registrados no inventário. LA exige IDs explícitos,
sem fallback. Preview sempre apresenta “Coleta desabilitada”.
As datas da interface usam America/Sao_Paulo e identificam o horário de Brasília.
A listagem “Saúde verificada ao vivo” continua sem confirmação: diagnóstico local
não é validação ao vivo na Meta.

## Base da auditoria

- Proxy: main 3d45ecdf61762e97c043f43db4baea6df381a203,
  app/api/meta/onboarding/exchange/route.ts. Handoff legado inclui apenas Eduardo.
- LA: main 19fdc1b1efc9b5a43dea5acc200bd8bda3524ee1,
  src/app/whatsapp/readiness/page.tsx, src/app/api/whatsapp/webhook/route.ts,
  src/lib/whatsapp/credentials.server.ts e migrations do WhatsApp/Vault.
- Eduardo: main d6b7f6f8e5f86675affd02b9adb8e03751edf48d,
  src/app/api/webhooks/meta/whatsapp/route.ts, src/lib/whatsapp/meta-client.ts,
  src/lib/whatsapp/meta-credentials.ts e migration de fundação.

Código consultado não comprova versão implantada, configuração Meta ou tráfego atual.
