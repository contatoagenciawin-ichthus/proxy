"use client";

import { useMemo, useState } from "react";
import { santeBrand } from "@/lib/creative-engine/brands/sante";
import { outubroRosaSante } from "@/lib/creative-engine/projects/outubro-rosa-sante";

type Mode = "automatico" | "editorial" | "fotografico" | "tecnico";

export default function CreativeEnginePage() {
  const [mode, setMode] = useState<Mode>("automatico");
  const [selectedSlide, setSelectedSlide] = useState(1);

  const slide = useMemo(
    () => outubroRosaSante.slides.find((item) => item.index === selectedSlide) ?? outubroRosaSante.slides[0],
    [selectedSlide]
  );

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#163B40]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              Proxy / Ichthus
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Creative Engine
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60 md:text-base">
              Direção de arte, brand system e composição determinística para criativos sociais.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black/55">
            PILOTO · SANTÉ
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold">Configuração</h2>

              <label className="mb-1.5 block text-xs font-medium text-black/55">Cliente</label>
              <select className="mb-4 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option>Santé Laboratório Veterinário</option>
              </select>

              <label className="mb-1.5 block text-xs font-medium text-black/55">Formato</label>
              <select className="mb-4 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option>Feed 4:5 · 1080 × 1350</option>
              </select>

              <label className="mb-1.5 block text-xs font-medium text-black/55">Direção</label>
              <div className="grid grid-cols-2 gap-2">
                {(["automatico","editorial","fotografico","tecnico"] as Mode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    className={
                      "rounded-xl border px-3 py-2 text-xs capitalize transition " +
                      (mode === item
                        ? "border-[#009C9C] bg-[#D9F0EF] text-[#006F73]"
                        : "border-black/10 bg-white text-black/55 hover:bg-black/[0.02]")
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Brand Kit</h2>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#006F73]">
                  ativo
                </span>
              </div>

              <div className="mb-4 flex gap-2">
                {Object.values(santeBrand.colors).slice(0, 7).map((color) => (
                  <span
                    key={color}
                    title={color}
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div className="space-y-2 text-xs leading-5 text-black/60">
                <p>Clean educativo.</p>
                <p>Sofisticado institucional.</p>
                <p>Teal como estrutura; rosa como accent da campanha.</p>
                <p>Sem instalações falsas geradas por IA.</p>
              </div>
            </section>
          </aside>

          <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                  {outubroRosaSante.client}
                </p>
                <h2 className="mt-1 text-xl font-semibold">Outubro Rosa também é delas</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {outubroRosaSante.slides.map((item) => (
                  <button
                    key={item.index}
                    onClick={() => setSelectedSlide(item.index)}
                    className={
                      "h-9 w-9 rounded-full border text-xs font-semibold transition " +
                      (selectedSlide === item.index
                        ? "border-[#009C9C] bg-[#009C9C] text-white"
                        : "border-black/10 bg-white text-black/50 hover:bg-black/[0.02]")
                    }
                  >
                    {item.index}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-[28px] bg-[#e8ecea] p-4 md:p-7">
                <div className="mx-auto aspect-[4/5] w-full max-w-[540px] overflow-hidden rounded-2xl bg-[#F7F3ED] shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
                  <div className="relative h-full p-[6%]">
                    <div className="absolute right-0 top-0 h-[42%] w-[42%] rounded-bl-[48%] bg-[#D9F0EF]" />
                    <div className="absolute bottom-0 left-0 h-[20%] w-full bg-[#009C9C]" />

                    <div className="relative z-10 max-w-[73%]">
                      <div className="mb-5 inline-flex rounded-full bg-[#D9F0EF] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#006F73]">
                        SANTÉ · OUTUBRO ROSA
                      </div>
                      <h3 className="text-[clamp(28px,5.2vw,72px)] font-black leading-[0.95] tracking-[-0.055em] text-[#006F73]">
                        {slide.title}
                      </h3>
                      {"body" in slide && slide.body ? (
                        <p className="mt-6 max-w-[90%] text-[clamp(12px,1.8vw,23px)] leading-[1.35] text-[#163B40]">
                          {slide.body}
                        </p>
                      ) : null}
                    </div>

                    <div className="absolute bottom-[4.5%] left-[6%] right-[6%] z-10 flex items-center justify-between text-[9px] font-medium text-white/90 md:text-[11px]">
                      <span>SANTÉ LABORATÓRIO VETERINÁRIO</span>
                      <span>{outubroRosaSante.footer}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-black/10 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                    Requisito visual
                  </p>
                  <p className="text-sm leading-6 text-black/65">{slide.visual}</p>
                </div>

                <div className="rounded-2xl border border-black/10 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                    Estado
                  </p>
                  <ul className="space-y-2 text-sm text-black/60">
                    <li>Brand Kit carregado</li>
                    <li>Briefing travado</li>
                    <li>6 slides · 1080 × 1350</li>
                    <li>Direção: {mode}</li>
                  </ul>
                </div>

                <button className="w-full rounded-2xl bg-[#163B40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2c30]">
                  Gerar variações
                </button>

                <button className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/65 transition hover:bg-black/[0.02]">
                  Exportar 4:5
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
