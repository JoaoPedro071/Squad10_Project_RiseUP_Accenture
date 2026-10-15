type Metric = {
  label: string;
  value: string;
  note: string;
};

type DemoContent = {
  category: string;
  title: string;
  description: string;
  status: string;
  highlight: string;
  metrics: Metric[];
};

const demos: Record<string, DemoContent> = {
  ciberseguranca: {
    category: "SECURITY OPERATIONS",
    title: "Centro de Cibersegurança",
    description:
      "Visão demonstrativa de eventos, alertas e proteção dos ambientes digitais.",
    status: "SISTEMAS PROTEGIDOS",
    highlight: "Monitoramento de ameaças em tempo real",
    metrics: [
      {
        label: "Eventos analisados",
        value: "24.8 mil",
        note: "nas últimas 24 horas",
      },
      {
        label: "Ameaças bloqueadas",
        value: "138",
        note: "ações automatizadas",
      },
      {
        label: "Disponibilidade",
        value: "99,9%",
        note: "serviços monitorados",
      },
    ],
  },

  ia: {
    category: "INTELIGÊNCIA ARTIFICIAL",
    title: "IA aplicada aos negócios",
    description:
      "Exemplos de como modelos de inteligência artificial podem apoiar decisões e operações.",
    status: "PLATAFORMA OPERACIONAL",
    highlight: "Dados transformados em decisões",
    metrics: [
      {
        label: "Modelos ativos",
        value: "18",
        note: "ambientes de demonstração",
      },
      {
        label: "Tarefas automatizadas",
        value: "72%",
        note: "do fluxo simulado",
      },
      {
        label: "Tempo economizado",
        value: "31%",
        note: "estimativa demonstrativa",
      },
    ],
  },

  logistica: {
    category: "LOGÍSTICA INTELIGENTE",
    title: "Operações e rotas",
    description:
      "Painel ilustrativo de fluxo logístico, planejamento de rotas e acompanhamento de entregas.",
    status: "OPERAÇÃO ESTÁVEL",
    highlight: "Acompanhamento integrado da operação",
    metrics: [
      {
        label: "Rotas monitoradas",
        value: "46",
        note: "rotas da simulação",
      },
      {
        label: "Entregas no prazo",
        value: "96,4%",
        note: "indicador ilustrativo",
      },
      {
        label: "Rotas otimizadas",
        value: "12",
        note: "na última atualização",
      },
    ],
  },

  quantica: {
    category: "COMPUTAÇÃO QUÂNTICA",
    title: "Laboratório de computação quântica",
    description:
      "Conteúdo demonstrativo sobre pesquisa, experimentos e aplicações potenciais da computação quântica.",
    status: "CONTEÚDO INFORMATIVO",
    highlight:
      "Explorando novas possibilidades de processamento",
    metrics: [
      {
        label: "Experimentos",
        value: "08",
        note: "no catálogo demonstrativo",
      },
      {
        label: "Linhas de pesquisa",
        value: "03",
        note: "áreas em destaque",
      },
      {
        label: "Próxima revisão",
        value: "Em breve",
        note: "agenda ilustrativa",
      },
    ],
  },
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{
    tema?: string | string[];
  }>;
}) {
  const params = await searchParams;

  const themeParam = Array.isArray(params.tema)
    ? params.tema[0]
    : params.tema;

  const content = demos[themeParam ?? "ia"] ?? demos.ia;

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b1020] p-6 text-white sm:p-10">
      <header className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-violet-300">
            RISEUP · INNOVATION CENTER
          </p>

          <p className="mt-1 text-xs text-white/50">
            EXPERIÊNCIA DIGITAL
          </p>
        </div>

        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-200 sm:text-xs">
          DEMONSTRAÇÃO
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-7">
        <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-violet-300 sm:text-sm">
          {content.category}
        </p>

        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {content.title}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-lg sm:leading-8">
          {content.description}
        </p>

        <div className="mt-8 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-5 sm:mt-10 sm:p-7">
          <p className="text-xs font-semibold tracking-wider text-violet-200">
            {content.status}
          </p>

          <p className="mt-2 text-lg font-medium sm:text-2xl">
            {content.highlight}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {content.metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
            >
              <p className="text-xs text-white/55 sm:text-sm">
                {metric.label}
              </p>

              <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                {metric.value}
              </p>

              <p className="mt-1 text-xs text-white/40">
                {metric.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[10px] text-white/35 sm:text-xs">
        <span>
          Ambiente de demonstração · Dados ilustrativos
        </span>

        <span>RISEUP</span>
      </footer>
    </main>
  );
}