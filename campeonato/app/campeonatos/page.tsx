"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CalendarDays,
  ChevronRight,
  Trophy,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  descricao: string | null;
  logo_url: string | null;
  status: string | null;
};

export default function CampeonatosPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  async function carregarCampeonatos() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("campeonatos")
      .select(`
        id,
        nome,
        temporada,
        ano,
        descricao,
        logo_url,
        status
      `)
      .order("ano", {
        ascending: false,
      })
      .order("nome", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Erro ao carregar campeonatos:",
        error
      );

      setErro(
        `Erro ao carregar campeonatos: ${error.message}`
      );

      setCarregando(false);
      return;
    }

    setCampeonatos(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarCampeonatos();
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Campeonatos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Escolha um campeonato para acompanhar jogos,
            resultados, classificação e artilharia.
          </p>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#080D09] p-10 text-center text-white/40">
            Carregando campeonatos...
          </div>
        ) : campeonatos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#080D09] p-12 text-center">
            <Trophy
              size={42}
              className="mx-auto text-[#18C929]/50"
            />

            <h2 className="mt-4 text-xl font-black">
              Nenhum campeonato disponível
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Os campeonatos cadastrados aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {campeonatos.map((campeonato) => (
              <Link
                key={campeonato.id}
                href={`/campeonatos/${campeonato.id}`}
                className="group relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#080D09] p-5 transition hover:-translate-y-1 hover:border-[#18C929]/30"
              >
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#18C929]/5 blur-3xl transition group-hover:bg-[#18C929]/10" />

                <div className="relative">
                  <div className="flex h-44 items-center justify-center rounded-[20px] border border-white/[0.06] bg-black/20 p-5">
                    {campeonato.logo_url ? (
                      <img
                        src={campeonato.logo_url}
                        alt={campeonato.nome}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Trophy
                        size={58}
                        className="text-[#18C929]/60"
                      />
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#18C929]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#18C929]">
                        {campeonato.status || "ativo"}
                      </span>

                      {(campeonato.ano ||
                        campeonato.temporada) && (
                        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10px] font-bold text-white/40">
                          {campeonato.ano ||
                            campeonato.temporada}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-2xl font-black">
                      {campeonato.nome}
                    </h2>

                    {campeonato.descricao ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/40">
                        {campeonato.descricao}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-white/25">
                        Acompanhe todos os dados deste campeonato.
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                      <div className="flex items-center gap-2 text-xs text-white/35">
                        <CalendarDays size={15} />
                        Acompanhar campeonato
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#18C929]"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}