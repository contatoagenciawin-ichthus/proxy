# G2 — administração assistida: API com segregação de privilégios

Código em PR Draft, com **todos os endpoints desabilitados por padrão**. Não aplicar migrations nem conceder acesso operacional em produção.

A rota `/api/meta/admin/requests/workflow/:organizationId/:protocolId` exige sessão GitHub de administrador da plataforma; a identidade de ator é resolvida no servidor. Apenas Preview da branch `feat/g2-workflow-admin-integration-20261106`, com `PROXY_REQUEST_WORKFLOW_ENABLED=true` e `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=true`, pode acessá-la. Os IDs precisam constar da allowlist configurada no servidor. A senha do banco não é exposta.

O adaptador de banco exige o login **dedicado** `proxy_connection_workflow_operator_login`, membro da role `proxy_connection_workflow_operator`, sem BYPASSRLS, sem SUPERUSER e sem vínculo à role de recepção. Ele não reutiliza a conexão de recibos. `connection-workflow-store.mjs` aplica FORCE RLS por organização, bloqueio otimista por versão, evento auditável e rollback conjunto.

O POST valida `Origin`, tipo JSON, limite de 4096 bytes e um contrato restrito; o método GET lê apenas o próprio protocolo. A etapa `active` continua explicitamente proibida pela política de negócio. Nenhuma alteração administrativa nesta API conecta/desconecta WABA, modifica Meta ou envia mensagens.

**Pendente para homologação:** verificar a migration e a role no Neon isolado; configurar o login exclusivo em Preview, executar testes reais de RLS e concorrência; só então habilitar a edição na ficha do protocolo. As páginas atuais continuam read-only. **Não declarar pronto para uso final.**


## Painel acoplado à ficha (código inativo até homologação)

A ficha autenticada do protocolo recebeu um painel client-side para atribuir operador, registrar providências/notas, avançar etapas permitidas e exibir eventos. O componente é montado somente quando o mesmo conjunto de flags e branch exigido pela API estiver ativo. A primeira atualização usa versão 1 e inicializa o workflow via `INSERT ... SELECT` exclusivamente se o recibo já existir. A execução não conecta número nem realiza passos Meta.

**Não há credencial de operador ou migration executada nesta PR**, de modo que o painel permanece inativo nas instalações atuais. A habilitação requer testes positivos e negativos de RLS com login dedicado e revisão da origem administrativa da Vercel.
