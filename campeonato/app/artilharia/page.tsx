"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  time_id: number | null;
  times:
    | {
        id: number;
        nome: string;
        sigla: string | null;
        escudo_url: string | null;
      }[]
    | null;
};

type EventoGol = {
  id: number;
  jogador_id: number | null;
  time_id: number | null;
  tipo: string;
};

type LinhaArtilharia = {
  jogador: Jogador;
  time: Time | null;
  gols: number;
};

export default function ArtilhariaPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [eventos, setEventos] = useState<EventoGol[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      { data: jogadoresData, error: jogadoresError },
      { data: eventosData, error: eventosError },
    ] = await Promise.all([
      supabase
        .from("jogadores")
        .select(`
          id,
          nome,
          numero,
          foto_url,
          time_id,
          times (
            id,
            nome,
            sigla,
            escudo_url
          )
        `)
        .order("nome", { ascending: true }),

      supabase
        .from("eventos_jogo")
        .select(`
          id,
          jogador_id,
          time_id,
          tipo
        `)
        .eq("tipo", "gol"),
    ]);

    if (jogadoresError) {
      console.error("Erro ao carregar jogadores:", jogadoresError);
      setErro(`Erro ao carregar jogadores: ${jogadoresError.message}`);
      setCarregando(false);
      return;
    }

    if (eventosError) {
      console.error("Erro ao carregar gols:", eventosError);
      setErro(`Erro ao carregar gols: ${eventosError.message}`);
      setCarregando(false);
      return;
    }

    setJogadores((jogadoresData ?? []) as unknown as Jogador[]);
    setEventos((eventosData ?? []) as EventoGol[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const artilharia = useMemo(() => {
    const golsPorJogador = new Map<number, number>();

    eventos.forEach((evento) => {
      if (!evento.jogador_id) return;

      const atual = golsPorJogador.get(evento.jogador_id) ?? 0;

      golsPorJogador.set(
        evento.jogador_id,
        atual + 1
      );
    });

    const lista: LinhaArtilharia[] = jogadores
      .map((jogador) => {
        const timeRelacionado =
          jogador.times && jogador.times.length > 0
            ? jogador.times[0]
            : null;

        return {
          jogador,
          time: timeRelacionado,
          gols: golsPorJogador.get(jogador.id) ?? 0,
        };
      })
      .filter((item) => item.gols > 0)
      .sort((a, b) => {
        if (b.gols !== a.gols) {
          return b.gols - a.gols;
        }

        return a.jogador.nome.localeCompare(
          b.jogador.nome
        );
      });

    return lista;
  }, [jogadores, eventos]);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
              Campeonato 2026
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Artilharia
            </h1>

            <p className="mt-2 text-white/50">
              Ranking calculado automaticamente pelos gols registrados nas partidas.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarDados}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
          >
            Atualizar
          </button>
        </div>

        {erro && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1b2e]">
          {carregando ? (
            <div className="p-10 text-center text-white/40">
              Carregando artilharia...
            </div>
          ) : artilharia.length === 0 ? (
            <div className="p-10 text-center text-white/40">
              Nenhum gol registrado ainda.
            </div>
          ) : (
            <div>
              {artilharia.map((item, index) => (
                <div
                  key={item.jogador.id}
                  className="flex flex-col gap-4 border-b border-white/[0.06] p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        index === 0
                          ? "bg-emerald-400 text-[#07111f]"
                          : "bg-white/5 text-white/60"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {item.jogador.foto_url ? (
                      <img
                        src={item.jogador.foto_url}
                        alt={item.jogador.nome}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white/50">
                        {item.jogador.numero || "?"}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">
                          {item.jogador.nome}
                        </h2>

                        {item.jogador.numero && (
                          <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-white/50">
                            #{item.jogador.numero}
                          </span>
                        )}
                      </div>

                      {item.time && (
                        <div className="mt-2 flex items-center gap-2">
                          {item.time.escudo_url && (
                            <img
                              src={item.time.escudo_url}
                              alt={item.time.nome}
                              className="h-5 w-5 object-contain"
                            />
                          )}

                          <span className="text-sm text-white/45">
                            {item.time.nome}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 sm:text-right">
                    <span className="text-4xl font-black text-emerald-300">
                      {item.gols}
                    </span>

                    <span className="text-sm text-white/40">
                      {item.gols === 1 ? "gol" : "gols"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}