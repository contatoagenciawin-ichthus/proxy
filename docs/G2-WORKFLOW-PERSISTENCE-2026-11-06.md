# G2 — serviço de persistência do atendimento assistido

Incremento de código desacoplado, em Draft. Requer, quando aprovado, a migration STAGED do PR anterior, um login dedicado da role `proxy_connection_workflow_operator`, autorização administrativa resolvida no servidor e transações explícitas com FORCE RLS.

A operação só existe para protocolo já recebido pela Proxy; o serviço não cria recibos fictícios. Rejeita operador não autorizado antes de abrir transação, confirma organização por `app.organization_id`, bloqueia linha `FOR UPDATE`, compara versão esperada e registra atualização e evento na **mesma transação**. A falha da auditoria cancela a alteração. Nenhum valor enviado pelo browser deve ser usado como `actorId`. Números, WABAs, tokens Meta e a marcação `active` não são alterados.

As transições permitidas, inclusive suspensão e cancelamento, são regras de fluxo administrativo; **não desconectam** nem conectam ativos da Meta. Procedimentos de desligamento técnico exigem operação própria e verificação de dependências.

Este PR não expõe endpoint de escrita nem utiliza o login restrito de recebimento. Isso é intencional até que o sistema de identidade administrativa, roles e registros de auditoria estejam homologados no banco de teste. Nenhuma migração foi aplicada.

Para o próximo ensaio: PostgreSQL de teste com roles separadas, RLS negando tenant estrangeiro, conexão do operador real, rollback e atualização concorrente; somente depois UI administrativa.
