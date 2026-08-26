export const metadata = {
  title: "Termos de Serviço | Proxy Technology",
  description: "Termos de Serviço da Proxy Technology para integrações e soluções digitais.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <article className="mx-auto max-w-3xl space-y-8 text-sm leading-7 text-zinc-300">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Proxy Technology</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Termos de Serviço</h1>
          <p>Última atualização: 26 de agosto de 2026.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Aplicação</h2>
          <p>
            Estes Termos regulam o acesso e o uso de soluções, integrações, automações, portais técnicos e demais
            serviços digitais oferecidos pela Proxy Technology, marca operada pela AGENCIA WIN LTDA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Uso autorizado</h2>
          <p>
            O usuário declara possuir autorização para conectar e administrar os ativos empresariais utilizados nas
            integrações. É vedado utilizar os serviços para fraude, abuso, violação de direitos de terceiros, envio de
            comunicações ilícitas ou qualquer finalidade incompatível com a legislação e com as regras das plataformas
            integradas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Plataformas de terceiros</h2>
          <p>
            Algumas funcionalidades dependem de serviços de terceiros, incluindo plataformas de mensageria,
            autenticação, hospedagem e APIs. O uso dessas funcionalidades também está sujeito aos termos, políticas,
            limites, preços e disponibilidade definidos pelos respectivos fornecedores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Credenciais e segurança</h2>
          <p>
            O cliente é responsável por manter sob controle as próprias contas e autorizações. Credenciais técnicas,
            tokens e segredos não devem ser compartilhados em canais públicos ou inseguros. Poderemos suspender uma
            integração em caso de risco técnico, suspeita de abuso ou necessidade de proteção dos ativos envolvidos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Disponibilidade</h2>
          <p>
            Buscamos manter os serviços disponíveis e confiáveis, mas integrações podem ser afetadas por manutenção,
            indisponibilidade de terceiros, mudanças de API, limitações regulatórias, bloqueios de conta ou eventos fora
            de nosso controle razoável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Privacidade</h2>
          <p>
            O tratamento de dados relacionado aos serviços é descrito em nossa Política de Privacidade, disponível em
            /privacy. Ao utilizar uma integração, o usuário também deve observar as políticas de privacidade das
            plataformas conectadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Encerramento e desautorização</h2>
          <p>
            Autorizações de integração podem ser revogadas pelo cliente ou pelas plataformas envolvidas. O encerramento
            de uma integração pode interromper funcionalidades dependentes daquele ativo ou daquela autorização.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Contato</h2>
          <p>
            Dúvidas sobre estes Termos podem ser encaminhadas à AGENCIA WIN LTDA pelo e-mail
            contatoagenciawin@gmail.com.
          </p>
        </section>
      </article>
    </main>
  )
}
