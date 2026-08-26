export const metadata = {
  title: "Política de Privacidade | Proxy Technology",
  description: "Política de Privacidade da Proxy Technology para integrações e serviços digitais.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <article className="mx-auto max-w-3xl space-y-8 text-sm leading-7 text-zinc-300">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Proxy Technology</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Política de Privacidade</h1>
          <p>Última atualização: 26 de agosto de 2026.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Quem somos</h2>
          <p>
            A Proxy Technology é uma marca operada pela AGENCIA WIN LTDA e desenvolve soluções digitais,
            integrações, automações e produtos de tecnologia para empresas e profissionais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Dados tratados</h2>
          <p>
            Conforme o serviço utilizado, podemos tratar dados de identificação e contato, dados empresariais,
            identificadores técnicos de contas e ativos digitais, informações necessárias para autenticação e
            autorização, registros de integração, eventos de webhook, logs técnicos e demais dados indispensáveis
            à execução da solução contratada.
          </p>
          <p>
            Em integrações com plataformas da Meta, isso pode incluir identificadores de contas empresariais,
            contas do WhatsApp Business, números de telefone, IDs técnicos, permissões concedidas e informações
            necessárias para processar mensagens e eventos autorizados pelo cliente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Finalidades</h2>
          <p>
            Utilizamos os dados para configurar e operar integrações, autenticar usuários, executar funcionalidades
            solicitadas, manter segurança e rastreabilidade, prestar suporte, investigar falhas, cumprir obrigações
            legais e melhorar a confiabilidade dos serviços.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Compartilhamento</h2>
          <p>
            Os dados podem ser processados por fornecedores de infraestrutura e plataformas necessárias à operação,
            sempre de acordo com a finalidade do serviço. Não vendemos dados pessoais. Quando uma integração depende
            de um provedor terceiro, o tratamento também está sujeito às políticas e termos desse provedor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Segurança e retenção</h2>
          <p>
            Adotamos medidas técnicas e organizacionais compatíveis com a natureza dos dados tratados. Credenciais e
            segredos de integração são mantidos em ambientes protegidos e não devem ser expostos no front-end. Os dados
            são mantidos pelo período necessário à execução do serviço, ao cumprimento de obrigações legais ou à defesa
            de direitos, e podem ser excluídos ou anonimizados quando deixarem de ser necessários.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Direitos dos titulares</h2>
          <p>
            Os titulares podem solicitar confirmação de tratamento, acesso, correção, exclusão quando aplicável,
            informações sobre compartilhamento e demais direitos previstos na legislação aplicável, incluindo a Lei
            Geral de Proteção de Dados Pessoais (LGPD).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Desautorização e exclusão</h2>
          <p>
            Usuários podem revogar autorizações concedidas a integrações por meio das próprias plataformas conectadas.
            Solicitações de exclusão relacionadas a integrações da Meta também podem ser encaminhadas pelo endpoint de
            exclusão de dados disponibilizado pela Proxy Technology ou diretamente por contato com nossa equipe.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Contato</h2>
          <p>
            Para assuntos de privacidade, proteção de dados ou solicitações relacionadas a esta política, entre em
            contato com a AGENCIA WIN LTDA pelo e-mail contatoagenciawin@gmail.com.
          </p>
        </section>
      </article>
    </main>
  )
}
