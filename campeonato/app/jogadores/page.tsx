"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  logo_url: string | null;
};

function tituloCampeonato(c: Campeonato | null) {
  if (!c) return "Todos os campeonatos";
  const temp = c.ano ?? c.temporada;
  return temp ? `${c.nome} • ${temp}` : c.nome;
}

type Time = {
  id: number;
  nome: string;
  escudo_url: string | null;
  campeonato_id: number | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  time_id: number | null;
};

export default function JogadoresPublicPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [campeonatoId, setCampeonatoId] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const params = new URLSearchParams(window.location.search);
      setCampeonatoId(params.get("campeonato") || "");

      const [cResp, tResp, jResp] = await Promise.all([
        supabase.from("campeonatos").select("id, nome, temporada, ano, logo_url").order("ano", { ascending: false }),
        supabase.from("times").select("id, nome, escudo_url, campeonato_id").order("nome"),
        supabase.from("jogadores").select("id, nome, numero, foto_url, time_id").order("nome"),
      ]);

      if (cResp.error) setErro(cResp.error.message);
      else if (tResp.error) setErro(tResp.error.message);
      else if (jResp.error) setErro(jResp.error.message);
      else {
        setCampeonatos((cResp.data ?? []) as Campeonato[]);
        setTimes((tResp.data ?? []) as Time[]);
        setJogadores((jResp.data ?? []) as Jogador[]);
      }

      setCarregando(false);
    }

    carregar();
  }, []);

  const campeonatoSelecionado = useMemo(
    () => campeonatos.find((c) => Number(c.id) === Number(campeonatoId)) ?? null,
    [campeonatos, campeonatoId]
  );

  const idsTimes = useMemo(
    () =>
      new Set(
        times
          .filter((t) => !campeonatoId || Number(t.campeonato_id) === Number(campeonatoId))
          .map((t) => t.id)
      ),
    [times, campeonatoId]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return jogadores.filter((j) => {
      const okCamp = !campeonatoId || (j.time_id !== null && idsTimes.has(j.time_id));
      const time = times.find((t) => t.id === j.time_id);
      const okBusca =
        !termo ||
        j.nome.toLowerCase().includes(termo) ||
        (time?.nome ?? "").toLowerCase().includes(termo) ||
        String(j.numero ?? "").includes(termo);

      return okCamp && okBusca;
    });
  }, [jogadores, campeonatoId, idsTimes, busca, times]);

  function selecionarCampeonato(valor: string) {
    setCampeonatoId(valor);
    const url = new URL(window.location.href);
    if (valor) url.searchParams.set("campeonato", valor);
    else url.searchParams.delete("campeonato");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#18C929]">FJU Esportes</p>
          <h1 className="mt-1 text-3xl font-black">Jogadores</h1>
          <p className="mt-1 text-sm text-white/35">Consulte os atletas e seus respectivos times.</p>
        </header>

        <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            <select
              value={campeonatoId}
              onChange={(e) => selecionarCampeonato(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#102713] px-4 py-3 text-sm outline-none"
            >
              <option value="">Todos os campeonatos</option>
              {campeonatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.ano ? ` - ${c.ano}` : c.temporada ? ` - ${c.temporada}` : ""}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar jogador, time ou número..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-11 pr-4 text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <div className="mt-4">
          <h2 className="text-lg font-black">{tituloCampeonato(campeonatoSelecionado)}</h2>
          <p className="mt-0.5 text-xs text-white/30">{filtrados.length} jogador(es)</p>
        </div>

        {erro ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{erro}</div>
        ) : carregando ? (
          <div className="mt-4 text-sm text-white/35">Carregando jogadores...</div>
        ) : filtrados.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Nenhum jogador encontrado.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((jogador) => {
              const time = times.find((t) => t.id === jogador.time_id) ?? null;

              return (
                <article
                  key={jogador.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#080D09] p-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04]">
                    {jogador.foto_url ? (
                      <img src={jogador.foto_url} alt={jogador.nome} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={23} className="text-[#18C929]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">{jogador.nome}</h3>
                    <p className="mt-1 truncate text-[10px] text-white/35">{time?.nome ?? "Sem time"}</p>
                  </div>

                  {jogador.numero !== null && (
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#18C929]/10 px-2 text-xs font-black text-[#18C929]">
                      {jogador.numero}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}