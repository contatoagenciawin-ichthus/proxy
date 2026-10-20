# G2 — Controlador servidor CRM → Proxy, STAGED (20/10/2026)

**Estado:** código isolado em draft, desativado por padrão; não existe rota HTTP correspondente e não foi efetuada requisição Meta.

## Controle implementado

- `lib/ichthus-proxy-oauth-controller.mjs` compõe o contrato de integridade HMAC, o uso único do ticket e a troca OAuth fictícia.
- Exige `enabled === true` **somente como opção de teste injetada pelo servidor**, além de `verifiedServiceIdentity === "ichthus-crm-server"`. **ATENÇÃO:** essa identidade não é autenticada pelo módulo. O futuro adaptador HTTP precisa obter a identidade de uma autenticação real entre servidores e **não pode copiá-la de um header/payload não autenticado**.
- Rejeita outro método/path, tipo de conteúdo diferente de JSON, presença de cookies/cabeçalhos de contexto de navegador, corpo acima de 12 KiB, campos extras ou ausência de valores necessários; utiliza ID do tenant Ichthus e config_id **do servidor**, não fornecidos pelo cliente.
- Verifica a assinatura da requisição sobre ticket e código OAuth antes de consumir o registro persistente; um replay não permite outra chamada do prestador de troca.
- Em caso de falha, nenhuma credencial Meta é retornada pelo controlador; testes usam somente callback fictício.

## Pendências críticas de segurança

1. **Autenticação real do canal CRM→Proxy:** implementar autenticação mútua ou mecanismo verificável entre servidores (identidade, segredo rotativo, audience, proteção contra reuso), associando `verifiedServiceIdentity` a evidência confiável. Cabeçalhos proibidos não substituem autenticação.
2. **CSRF/Meta Embedded Signup:** avaliar o comportamento real dos callbacks da Meta; o envelope HMAC do CRM comprova integridade de dados assinados, mas **não prova que o código foi emitido pela Meta para o state de sessão correto**. Esse vínculo deve ser comprovado antes de ativar a rota.
3. **Uso único durável:** fornecer `consumeOnce` com pool mínimo Neon, nunca implementação em memória. A role restrita da branch descartável já foi homologada via SQL, mas **nenhuma credencial foi integrada à Vercel**.
4. **Token/ativo:** após troca real, verificar app/scopes/WABA/phone via Graph e entregar credencial somente no receptor do CRM aprovado. Não enviar código/token ao navegador nem registrar em logs.
5. **Configuração:** `enabled=false` operacional até revisão e autorização; nenhuma alteração na rota Eduardo e nenhum webhook Meta nessa etapa.

**Testes:** `tests/ichthus-proxy-oauth-controller.test.mjs` valida default desativado, formato, requisição browser-shaped, identidade inválida, adulteração, ordenação commit→troca e replay.
