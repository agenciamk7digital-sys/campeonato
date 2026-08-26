"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Search } from "lucide-react";
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
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
};

export default function TimesPublicPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [campeonatoId, setCampeonatoId] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams(window.location.search);
      const campeonatoUrl = params.get("campeonato") || "";
      setCampeonatoId(campeonatoUrl);

      const [cResp, tResp] = await Promise.all([
        supabase
          .from("campeonatos")
          .select("id, nome, temporada, ano, logo_url")
          .order("ano", { ascending: false })
          .order("nome", { ascending: true }),
        supabase
          .from("times")
          .select("id, nome, sigla, escudo_url, campeonato_id")
          .order("nome", { ascending: true }),
      ]);

      if (cResp.error) {
        setErro(`Erro ao carregar campeonatos: ${cResp.error.message}`);
      } else if (tResp.error) {
        setErro(`Erro ao carregar times: ${tResp.error.message}`);
      } else {
        setCampeonatos((cResp.data ?? []) as Campeonato[]);
        setTimes((tResp.data ?? []) as Time[]);
      }

      setCarregando(false);
    }

    carregar();
  }, []);

  const campeonatoSelecionado = useMemo(
    () =>
      campeonatos.find(
        (c) => Number(c.id) === Number(campeonatoId)
      ) ?? null,
    [campeonatos, campeonatoId]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return times.filter((time) => {
      const okCampeonato =
        !campeonatoId ||
        Number(time.campeonato_id) === Number(campeonatoId);

      const okBusca =
        !termo ||
        time.nome.toLowerCase().includes(termo) ||
        (time.sigla ?? "").toLowerCase().includes(termo);

      return okCampeonato && okBusca;
    });
  }, [times, campeonatoId, busca]);

  function selecionarCampeonato(valor: string) {
    setCampeonatoId(valor);
    const url = new URL(window.location.href);

    if (valor) {
      url.searchParams.set("campeonato", valor);
    } else {
      url.searchParams.delete("campeonato");
    }

    window.history.replaceState({}, "", url.toString());
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#18C929]">
            FJU Esportes
          </p>
          <h1 className="mt-1 text-3xl font-black">Times</h1>
          <p className="mt-1 text-sm text-white/35">
            Consulte as equipes participantes dos campeonatos.
          </p>
        </header>

        <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            <select
              value={campeonatoId}
              onChange={(e) => selecionarCampeonato(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#102713] px-4 py-3 text-sm outline-none focus:border-[#18C929]/40"
            >
              <option value="">Todos os campeonatos</option>
              {campeonatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.ano ? ` - ${c.ano}` : c.temporada ? ` - ${c.temporada}` : ""}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar time..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#18C929]/40"
              />
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">{tituloCampeonato(campeonatoSelecionado)}</h2>
            <p className="mt-0.5 text-xs text-white/30">{filtrados.length} equipe(s)</p>
          </div>
        </div>

        {erro ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        ) : carregando ? (
          <div className="mt-4 text-sm text-white/35">Carregando times...</div>
        ) : filtrados.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Nenhum time encontrado.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((time) => (
              <article
                key={time.id}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#080D09] p-4"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#18C929]/10 p-1.5">
                  {time.escudo_url ? (
                    <img
                      src={time.escudo_url}
                      alt={time.nome}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Shield size={24} className="text-[#18C929]" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black">{time.nome}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase text-white/30">
                    {time.sigla || "Equipe"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
