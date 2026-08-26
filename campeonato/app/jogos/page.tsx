"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Shield } from "lucide-react";
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

type TimeRelacionado = {
  id: number;
  nome: string;
  escudo_url: string | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;
  gols_casa: number | null;
  gols_visitante: number | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;
  fase: string | null;
  perna: string | null;
  tipo_resultado: string | null;
  time_casa: TimeRelacionado | TimeRelacionado[] | null;
  time_visitante: TimeRelacionado | TimeRelacionado[] | null;
};

function rel(v: TimeRelacionado | TimeRelacionado[] | null) {
  return Array.isArray(v) ? v[0] ?? null : v;
}

function dataBr(data: string | null) {
  if (!data) return "Data não informada";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

export default function JogosPublicPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [campeonatoId, setCampeonatoId] = useState("");
  const [status, setStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const params = new URLSearchParams(window.location.search);
      setCampeonatoId(params.get("campeonato") || "");

      const [cResp, jResp] = await Promise.all([
        supabase.from("campeonatos").select("id, nome, temporada, ano, logo_url").order("ano", { ascending: false }),
        supabase
          .from("jogos")
          .select(`
            id, campeonato_id, gols_casa, gols_visitante,
            data_jogo, horario, local, status, fase, perna, tipo_resultado,
            time_casa:times!jogos_time_casa_id_fkey (id, nome, escudo_url),
            time_visitante:times!jogos_time_visitante_id_fkey (id, nome, escudo_url)
          `)
          .order("data_jogo", { ascending: false })
          .order("horario", { ascending: false }),
      ]);

      if (cResp.error) setErro(cResp.error.message);
      else if (jResp.error) setErro(jResp.error.message);
      else {
        setCampeonatos((cResp.data ?? []) as Campeonato[]);
        setJogos((jResp.data ?? []) as unknown as Jogo[]);
      }

      setCarregando(false);
    }

    carregar();
  }, []);

  const campeonatoSelecionado = useMemo(
    () => campeonatos.find((c) => Number(c.id) === Number(campeonatoId)) ?? null,
    [campeonatos, campeonatoId]
  );

  const filtrados = useMemo(
    () =>
      jogos.filter(
        (j) =>
          (!campeonatoId || Number(j.campeonato_id) === Number(campeonatoId)) &&
          (!status || j.status === status)
      ),
    [jogos, campeonatoId, status]
  );

  function selecionarCampeonato(valor: string) {
    setCampeonatoId(valor);
    const url = new URL(window.location.href);
    if (valor) url.searchParams.set("campeonato", valor);
    else url.searchParams.delete("campeonato");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#18C929]">FJU Esportes</p>
          <h1 className="mt-1 text-3xl font-black">Jogos</h1>
          <p className="mt-1 text-sm text-white/35">Partidas, resultados e próximos confrontos.</p>
        </header>

        <section className="grid gap-3 rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4 sm:grid-cols-2 sm:p-5">
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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-[#102713] px-4 py-3 text-sm outline-none"
          >
            <option value="">Todos os status</option>
            <option value="agendado">Agendados</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </section>

        <div className="mt-4">
          <h2 className="text-lg font-black">{tituloCampeonato(campeonatoSelecionado)}</h2>
          <p className="mt-0.5 text-xs text-white/30">{filtrados.length} partida(s)</p>
        </div>

        {erro ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{erro}</div>
        ) : carregando ? (
          <div className="mt-4 text-sm text-white/35">Carregando jogos...</div>
        ) : filtrados.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Nenhuma partida encontrada.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filtrados.map((jogo) => {
              const casa = rel(jogo.time_casa);
              const visitante = rel(jogo.time_visitante);
              const finalizado = jogo.status === "finalizado";

              return (
                <article key={jogo.id} className="rounded-2xl border border-white/[0.07] bg-[#080D09] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                      <CalendarDays size={13} className="text-[#18C929]" />
                      {dataBr(jogo.data_jogo)}
                      {jogo.horario ? ` • ${jogo.horario.slice(0, 5)}` : ""}
                    </div>

                    <div className="flex gap-2">
                      {jogo.tipo_resultado === "wo" && (
                        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-black uppercase text-amber-300">
                          W.O.
                        </span>
                      )}
                      {jogo.fase && (
                        <span className="rounded-full bg-[#18C929]/10 px-2 py-1 text-[9px] font-black uppercase text-[#18C929]">
                          {jogo.fase.replaceAll("_", " ")}
                          {jogo.perna ? ` • ${jogo.perna}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <Time time={casa} />
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center font-black">
                      {finalizado ? `${jogo.gols_casa ?? 0} × ${jogo.gols_visitante ?? 0}` : "VS"}
                    </div>
                    <Time time={visitante} />
                  </div>

                  <p className="mt-4 border-t border-white/[0.05] pt-3 text-center text-[10px] text-white/25">
                    {jogo.local || (jogo.status === "agendado" ? "Local não informado" : "Partida finalizada")}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Time({ time }: { time: TimeRelacionado | null }) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] p-1">
        {time?.escudo_url ? (
          <img src={time.escudo_url} alt={time.nome} className="h-full w-full object-contain" />
        ) : (
          <Shield size={18} className="text-[#18C929]" />
        )}
      </div>
      <p className="mt-2 truncate text-xs font-black">{time?.nome ?? "Time"}</p>
    </div>
  );
}
