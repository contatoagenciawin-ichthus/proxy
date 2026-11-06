# Proxy G2 — ficha administrativa de protocolo, primeiro incremento

Status: **Draft, consulta somente leitura, sem alterações de banco ou Meta**.

`/meta/admin` já contém recibos da fila central. Este incremento cria a ficha por `/meta/admin/requests/:organizationId/:protocolId`, apenas para administrador Proxy autenticado, usando a mesma listagem com allowlist server-side e FORCE RLS. A correspondência exige dois UUIDs válidos e igualdade exata, sem dar ao navegador escolha de um tenant fora da allowlist. Em caso de indisponibilidade, não exibe falsamente fila vazia.

Campos existentes: tenant UUID, protocolo, produto, canal, status de recebimento e horário do recibo. **Não inventar** contato/número, BM, WABA, atendente ou confirmação Meta. Esses dados dependerão de tabelas e eventos próprios, com operações auditáveis e autorização separada.

Lacunas: entrada no menu dedicado WhatsApp → Solicitações; persistência de responsável/pendências/histórico e estados de atendimento; registro de ativos vinculados ao protocolo; ativação após testes reais. Nenhuma funcionalidade de escrita ou desconexão é introduzida aqui.
