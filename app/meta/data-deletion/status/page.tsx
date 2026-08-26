type Props = {
  searchParams?: Promise<{ code?: string }>
}

export default async function DataDeletionStatusPage({ searchParams }: Props) {
  const params = (await searchParams) || {}

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Proxy Technology
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Solicitação registrada</h1>
        <p className="mt-4 leading-7 text-slate-300">
          A solicitação de exclusão de dados foi recebida. Como este portal técnico não mantém perfil público de usuário final, eventuais dados vinculados a uma integração serão tratados conforme a relação operacional aplicável.
        </p>
        {params.code ? (
          <p className="mt-6 text-sm text-slate-400">
            Código de confirmação: <strong className="text-white">{params.code}</strong>
          </p>
        ) : null}
      </div>
    </main>
  )
}
