# ADR — Backoffice Proxy como control plane de tenants (FinOps v1)

Data: 2026-11-08
Estado: proposta auditada em código, SEM autorização de deploy, credenciais, migração ou alterações no tenant LA.
Referências: Proxy #46; LA #74.

## Decisão proposta
Criar domínio administrativo próprio para **Tenants / FinOps**, separado de `/meta/admin` (inventário e operações Meta), reutilizando a política de autenticação individual da plataforma após auditoria das rotas e controles. Não tomar `lib/meta-admin/inventory.mjs` como cadastro contratual: é um inventário manual de evidências. O control plane Proxy deverá ter registro canônico de tenants, contratos, serviços e fontes, sem importar contatos, mensagens ou informações de CRM.

## Constatações do código em main (08/11)
- `docs/PROXY-META-ADMIN-V1.md`, `app/meta/admin/page.tsx`, `lib/meta-admin/auth.ts`, `lib/meta-admin/policy.mjs`: login GitHub/Auth.js por ID imutável em allowlist; `PROXY_ADMIN_ENABLED` fail-closed, sessão JWT de 1h; inventário apenas curado. Este mecanismo não constitui, sozinho, RBAC de escrita nem trilha de auditoria FinOps.
- LA: migrations `20261107213000`, `20261107223000`, `20261107223500` implementam reserva transacional e snapshot restrito a `service_role`. O ledger é a fonte de verdade local; snapshots são **estimativas**, nunca faturamento conciliado.
- `src/lib/whatsapp/audio-transcription.server.ts` consulta orçamento local e reserva antes de chamar OpenAI. O webhook/rotas de transcrição não devem ser alterados na v1 de integração.
- Segregação atual entre produtos: `proxy-relationship-demo` não é o CRM-master Marc.I.A.

## Arquitetura-alvo
1. **Registry privado Proxy**: `tenant_id` canônico Proxy; mapeamento explícito `source_system` + `external_organization_id`; produto, ambiente, ciclo de vida, vínculo de contrato, receita recorrente e implantação em contas distintas. Chaves únicas por namespace e isolamento. Não copiar o inventário Meta como fonte de verdade.
2. **Conector de leitura v1 para LA**: backend Proxy autenticado e autorizado; tenant LA e `organization_id` explicitamente vinculados por allowlist; invocação da RPC `whatsapp_audio_budget_snapshot` exclusivamente via contexto de serviço; segredos somente server-side. Verificar projeto/organization antes de qualquer teste real. Não introduzir endpoint público nem credenciais no navegador. Avaliar ponte dedicada autenticada com escopo de recursos como padrão de próximos CRMs para não distribuir `service_role` de cada tenant no Provider.
3. **Contrato de telemetria versionado**: `schema_version`, `tenant_id`, `source_system`, `external_organization_id`, `service`, `period_start/end`, `timezone`, `currency`, `estimated_cents`, `reserved_cents`, `uncertain_cents`, `actual_reconciled_cents|null`, `actual_source|null`, `fetched_at`, `completeness`; sem PII, mensagens ou payloads brutos. `null` significa indisponível, nunca zero.
4. **Economia**: recorrência e setup separados; custos específicos de tenant, compartilhados com regra de rateio, estimativas e custos efetivos segregados; não anunciar lucro sem custos apurados. Preços e políticas próprios por tenant.
5. **Leitura eficiente**: refresh sob demanda com cache de curta duração; agregações periódicas somente se justificadas; sem polling OpenAI/Meta a cada mensagem nem cron permanente na primeira entrega.
6. **Segurança**: autorização em todas as rotas/API, anti-CSRF para mutations, isolamento cross-tenant, controle de segredo, política fail-closed, validação de origem e auditoria imutável de operações administrativas (ator/escopo/data/antes/depois/motivo). Inicialmente **read-only**; ajustes de política apenas em fase separada, com testes e controle de concorrência.

## Cuidados detectados
- O snapshot existente LA devolve `spent_estimate_cents` agregado e limites; **não** discrimina por si só reservado versus incerto versus conciliado. A UI v1 deve mostrar apenas campos disponíveis e não inventar a decomposição. Extensão para telemetria detalhada exige contrato e avaliação de segurança no repo LA.
- A configuração atual de autenticação é para administração Meta. Sua ampliação para FinOps precisa de autorização por recurso/ação, sem supor que todo usuário do Meta Admin possa alterar políticas financeiras.
- A tolerância LA de R$ 3 não libera novas chamadas após o soft limit de R$ 30. Não implementar `hard_limit` como autorização adicional de transcrição.
- Mensalidade LA R$ 297, áudio R$ 30, tolerância R$ 3: R$ 267/264 são resíduos antes de outros custos, **não lucro**. Valores exclusivos da LA.

## Fases e gates
- **F0**: ADR e modelo do registry; inventário dos provedores/custos e matriz de permissões; nenhum deploy.
- **F1**: contrato TypeScript puro, cálculo financeiro e testes unitários isolados (sem credenciais/banco).
- **F2**: conector read-only LA em ambiente controlado, testes de auth, cross-tenant, ausência de PII, cache/erro, e verificação da RPC; nenhuma escrita no ledger.
- **F3**: UI Proxy Tenants / FinOps em admin próprio, métricas rotuladas por origem, período, atualização e grau de confiança.
- **F4**: revisão de segurança, testes automatizados HTTP e aceite antes de qualquer merge/publicação. Publicar por lote visando baixo custo Vercel.
- **F5 posterior**: policies, ajustes, trilha financeira de reconciliação, alertas e CRM-master por adaptadores versionados. Exige nova validação.

Critério de aceite piloto: usuário de tenant/anon recebe 403/negação; operador Proxy autorizado vê somente LA vinculada com valores estimados locais e rótulo; nenhum custo sensível aparece em tenant UI/API; nenhuma chamada OpenAI extra nem transcrição causada pelo painel; baseline WhatsApp/LA permanece intacta.
