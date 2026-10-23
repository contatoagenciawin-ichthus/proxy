# Proxy Meta Provider — administração v1

Decisão de produto aprovada pelo responsável em 23/10/2026: construir a administração das integrações na Proxy, separada da visão de cada organização no CRM. Esta entrega é uma etapa restrita de inventário e diagnóstico do G2; não substitui a homologação WhatsApp nem altera o Roadmap do CRM.

## Escopo entregue

- `/meta/admin`: inventário de Eduardo Brasil, LA Climatização e Ichthus.
- `/meta/admin/connections/[client]`: ativos conhecidos, origem/data das evidências, verificações pendentes e próxima ação.
- `/meta/admin/login`: autenticação individual GitHub via Auth.js v5, com autorização explícita por ID numérico estável da conta GitHub. Não depende de e-mail, nome, cookie Better Auth, função ou membership dos CRMs.
- Nenhuma consulta automática à Meta, aos bancos ou às conversas dos clientes. O arquivo `lib/meta-admin/inventory.mjs` é um registro curado e versionado de evidências, não um cadastro dinâmico nem monitoramento em tempo real.
- Eduardo e LA: produção informada pelo responsável. Saúde atual desconhecida. Ichthus: ativos conferidos por capturas, homologação pendente.
- IDs ausentes ficam nulos. App ID da LA tem origem documental no ADR do PR #19, não em consulta nova ao aplicativo.

## Acesso e ativação do preview

O acesso fica desabilitado por padrão. Nenhuma credencial Meta, callback ou autorização existente é reutilizada.

1. Criar uma aplicação OAuth **GitHub separada**, pertencente à Proxy, usando uma URL estável do preview. O callback é `https://<host-preview>/api/meta/admin/auth/callback/github`. Não alterar o Meta App para este login. GitHub é apenas o provedor da identidade administrativa; a autorização é local.
2. Definir no **preview desta branch**, diretamente nas interfaces oficiais, sem compartilhar segredos no chat:
   - `PROXY_ADMIN_ENABLED=true`
   - `PROXY_ADMIN_ORIGIN=https://<host-preview>` (origem exata, sem caminho)
   - `PROXY_ADMIN_AUTH_SECRET` (segredo exclusivo de sessão, mínimo 32 caracteres, gerado e guardado pelo responsável)
   - `PROXY_ADMIN_GITHUB_ID` e `PROXY_ADMIN_GITHUB_SECRET` (aplicação OAuth administrativa)
   - `PROXY_ADMIN_GITHUB_IDS` (lista explícita dos IDs GitHub autorizados, separados por vírgula)
3. Não usar as variáveis `AUTH_URL`/`NEXTAUTH_URL` herdadas de outro sistema neste deployment. O domínio deve corresponder exatamente à origem e ao callback configurados.
4. Fazer novo preview e testar login real, acesso permitido, conta negada e saída. Isso ainda depende da configuração OAuth; testes locais usam sessões sintéticas, não comprovam o fluxo OAuth externo.
5. Não promover a produção nesta entrega. Antes disso: aprovação, teste OAuth real, política de acesso, verificação de MFA nas contas GitHub autorizadas e revisão da dependência Auth.js em beta.

Não foi criado usuário administrador automaticamente. A escolha dos IDs e o consentimento OAuth pertencem ao responsável. Não pedir tokens ou segredos em chat. A autenticação usa somente `read:user`, sem acesso a repositórios.

## Controles

Autorização no servidor antes de acessar inventário em cada página; checagem de lista em cada leitura de sessão; remoção de ID revoga acesso de sessões existentes. Cookies de sessão criptografados pela biblioteca, host-only, HttpOnly, Secure em HTTPS, SameSite=Lax e validade de uma hora. Nenhum token OAuth GitHub é retido no JWT. Host/origem validados nas rotas de autenticação; CSRF e fluxo OAuth geridos pela biblioteca. Páginas sem cache compartilhado, sem indexação, sem incorporação em iframe. Sem rotas de escrita de conexões.

O painel não aceita identidade por cabeçalhos de usuário, parâmetros de URL ou roles enviados pelo browser. Cookies de sessão dos CRMs não conferem acesso. Não há endpoint público de inventário. Fichas desconhecidas retornam 404 somente depois da autorização.

## Testes e limites

- `node --test tests/meta-admin.test.mjs`: configuração ausente, allowlist, provedor incorreto, tentativa de elevação por atualização da sessão, revogação e semântica do inventário.
- `npx tsc -p tsconfig.meta-admin.json --noEmit`: tipagem da área nova. A checagem global possui erros anteriores em telas de anúncios e em product-grid2; não foram mascarados ou corrigidos neste escopo. O projeto já usa `ignoreBuildErrors` no build.
- `npm run build`: build completo. No runtime local foi necessário `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` para obter as fontes Google com os certificados do sistema; nenhuma validação TLS foi desativada.
- `node tests/meta-admin-http.mjs`: build Next real em porta local, sessões sintéticas criptografadas, proteção de overview/detalhes/RSC, cookie inválido/revogado/de CRM, CSRF, origem, desabilitação e preservação da página de revisão. Não faz chamadas OAuth/Meta nem envia mensagens.

## Próxima entrega

Após login homologado: consultas de diagnóstico por cliente, usando serviços segregados que retornam somente metadados seguros. Não centralizar tokens nem conceder leitura genérica aos bancos dos CRMs. Antes de cada integração, confirmar origem, contrato e autorização. A tela do CRM deve mostrar somente a conexão da própria organização.

## Rollback

Reverter este PR ou manter `PROXY_ADMIN_ENABLED` ausente/false desabilita o acesso. Nenhuma migração de banco, inscrição WABA, callback global, mudança de token ou alteração em LA/Eduardo acompanha esta entrega.
