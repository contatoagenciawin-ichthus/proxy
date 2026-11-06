# G2 — administração assistida: API com segregação de privilégios

Código em PR Draft, com **todos os endpoints desabilitados por padrão**. Não aplicar migrations nem conceder acesso operacional em produção.

A rota `/api/meta/admin/requests/workflow/:organizationId/:protocolId` exige sessão GitHub de administrador da plataforma; a identidade de ator é resolvida no servidor. Apenas Preview da branch `feat/g2-workflow-admin-integration-20261106`, com `PROXY_REQUEST_WORKFLOW_ENABLED=true` e `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=true`, pode acessá-la. Os IDs precisam constar da allowlist configurada no servidor. A senha do banco não é exposta.

O adaptador de banco exige o login **dedicado** `proxy_connection_workflow_operator_login`, membro da role `proxy_connection_workflow_operator`, sem BYPASSRLS, sem SUPERUSER e sem vínculo à role de recepção. Ele não reutiliza a conexão de recibos. `connection-workflow-store.mjs` aplica FORCE RLS por organização, bloqueio otimista por versão, evento auditável e rollback conjunto.

O POST valida `Origin`, tipo JSON, limite de 4096 bytes e um contrato restrito; o método GET lê apenas o próprio protocolo. A etapa `active` continua explicitamente proibida pela política de negócio. Nenhuma alteração administrativa nesta API conecta/desconecta WABA, modifica Meta ou envia mensagens.

**Pendente para homologação:** verificar a migration e a role no Neon isolado; configurar o login exclusivo em Preview, executar testes reais de RLS e concorrência; só então habilitar a edição na ficha do protocolo. As páginas atuais continuam read-only. **Não declarar pronto para uso final.**


## Painel acoplado à ficha (código inativo até homologação)

A ficha autenticada do protocolo recebeu um painel client-side para atribuir operador, registrar providências/notas, avançar etapas permitidas e exibir eventos. O componente é montado somente quando o mesmo conjunto de flags e branch exigido pela API estiver ativo. A primeira atualização usa versão 1 e inicializa o workflow via `INSERT ... SELECT` exclusivamente se o recibo já existir. A execução não conecta número nem realiza passos Meta.

**Não há credencial de operador ou migration executada nesta PR**, de modo que o painel permanece inativo nas instalações atuais. A habilitação requer testes positivos e negativos de RLS com login dedicado e revisão da origem administrativa da Vercel.


## Homologação SQL isolada — 06/11/2026

**Banco:** projeto Neon `falling-mouse-74404571`, nova branch filha `g2-workflow-admin-test-20261106` (`br-hidden-voice-b62ms74u`), originada de `g2-e2e-proxy-20261103`; database `proxy_g2_homolog`.

1. Migration `db/staged/0002_proxy_request_workflow_STAGED.sql` executada em transação **somente na nova branch filha**. Duas tabelas presentes, ambas com `FORCE ROW LEVEL SECURITY`. Role `proxy_connection_workflow_operator` NOLOGIN criada.
2. Para simular o operador sem criar uma credencial externa, a branch filha recebeu `GRANT proxy_connection_workflow_operator TO proxy_g2_owner WITH SET TRUE`. **Esse grant de teste não deve ser replicado em produção.** Transações de teste executadas com `SET LOCAL ROLE proxy_connection_workflow_operator`.
3. Sob `app.organization_id=55555555-5555-4555-8555-555555555555`, a role enxergou apenas 1 recibo (protocolo `77777777-7777-4777-8777-777777777777`). Sob `11111111-1111-4111-8111-111111111111`, enxergou os outros 2 recibos, mas **zero** workflows e eventos do protocolo `7777...`. Sem `app.organization_id`, nenhuma linha administrativa visível.
4. Gravação real de teste na branch filha: protocolo `7777...` passou para `under_review`, versão 2, operador `233162528`, próxima providência `Validar autorização do titular`; 1 evento de auditoria persistido.
5. Atualização com versão antiga 1 retornou zero linhas e manteve a versão 2. Outra transação alterou a linha e provocou `CHECK` inválido no evento; o Neon abortou a transação, e a leitura seguinte confirmou `stage=under_review`, `version=2` e 1 evento (rollback).
6. `has_table_privilege`: role de recepção não tem UPDATE da tabela de workflow nem INSERT em eventos; role administrativa não tem INSERT/UPDATE nos recibos originais.
7. **Ainda não testado:** login dedicado real `proxy_connection_workflow_operator_login`, integração com o endpoint Next.js e painel, concorrência entre sessões reais, reversões de rede, estado em outras organizações reais, múltiplos tenants ou Meta. Nenhuma env nova ou deployment de produção foi alterado.

A branch original de recebimento `br-damp-breeze-b6wy5ij3` permaneceu intacta. Manter a filial de teste para validação subsequente; limpeza requer autorização específica.


## Credencial restrita e teste autenticado — 06/11/2026

Somente na branch Neon filha `g2-workflow-admin-test-20261106` (`br-hidden-voice-b62ms74u`), foi provisionado o login `proxy_connection_workflow_preview_login`, com senha gerenciada pelo Neon, sem SUPERUSER/BYPASSRLS/CREATEROLE e com membership apenas em `proxy_connection_workflow_operator` (não pertence à role de recepção). O login tem privilégios de leitura/escrita **apenas** nas duas tabelas administrativas e leitura do recibo. A configuração inicial de escopo read-only do Neon aponta para o schema vazio `proxy_workflow_login_anchor`. A role inicial de SQL `proxy_connection_workflow_operator_login`, que não recebeu senha, foi explicitamente colocada em `NOLOGIN`.

Em SQL autenticado com o login de Preview: o tenant `55555555-5555-4555-8555-555555555555` enxergou seu workflow, enquanto o tenant `11111111-1111-4111-8111-111111111111` não visualizou o protocolo `7777...`. Foi executada atualização real e auditoria no mesmo transaction: workflow `7777...`, `stage=under_review`, versão 3, próxima ação de consentimento. Nenhum registro no Neon da branch original foi alterado.

A Vercel do projeto `proxy` recebeu **somente na branch Preview** `feat/g2-workflow-admin-integration-20261106` quatro envs: `PROXY_REQUEST_WORKFLOW_DATABASE_URL` (sensível, Neon filho), `PROXY_REQUEST_WORKFLOW_ENABLED=false`, `PROXY_CONNECTION_REQUEST_ALLOWED_ORGS` (tenant fictício único) e `PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED=false`. Não foram copiadas credenciais de produção. O painel e a API seguem **inativos**.

O runtime foi atualizado para exigir o login `proxy_connection_workflow_preview_login` e rejeitar atribuições a GitHub IDs que não estejam na lista autorizada de administradores.

**Pendência real para E2E via navegador:** vincular no Preview a sessão GitHub/Proxy com origem/callback autorizados; disponibilizar a leitura de recibos exclusivamente da branch filha com login de leitura adequado; habilitar temporariamente os gates somente após revisar esses pontos, realizar edição auditada e restaurar `false`. Não reutilizar automaticamente o OAuth de outra URL. Nenhum ativo Meta ou WABA foi alterado.
