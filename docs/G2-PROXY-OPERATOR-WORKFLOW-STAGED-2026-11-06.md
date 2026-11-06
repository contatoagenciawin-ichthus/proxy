# Proxy G2 — operação de solicitações (modelo preparado)

Status: **rascunho sem migrations executadas, sem endpoint de escrita, sem login novo e sem ativação**.

Separar a prova imutável de entrega (`proxy_control.connection_requests`) dos dados administrativos. A nova tabela de workflow registra etapa, responsável, próxima providência e versão otimista. O histórico imutável registra autor e ação. RLS FORCE por organização continua obrigatório; a role de operação deve ser distinta da role de recepção, com privilégios mínimos e autorização GitHub/Proxy no servidor.

Transições controladas: recebido → revisão → autorização → validação técnica → validação operacional. **A etapa `active` está bloqueada por padrão** até validador no backend verificar autorização, ativos Meta, eventos reais, resposta humana e isolamento do tenant. Nenhum formulário ou mudança do campo de etapa pode, isoladamente, ativar números, IA ou WABA.

Próximos incrementos: testar migration em branch Neon descartável; criar serviço de escrita com role/login restritos e lock otimista por versão; auditoria transacional; então oferecer campos editáveis somente a operadores autorizados. Não reutilizar URL do receptor para escrita: o receptor deve permanecer SELECT/INSERT de recibos, sem permissão de alterar workflows. O CRM receberá mudanças de etapa por callbacks assinados depois da implementação.

Nenhuma nova credencial Vercel é necessária **agora**: o modelo de dados não foi aplicado nem habilitado.
