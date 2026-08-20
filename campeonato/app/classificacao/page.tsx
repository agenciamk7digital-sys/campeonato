"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type Jogo = {
  id: number;
  time_casa_id: number;
  time_visitante_id: number;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: string | null;
};

type LinhaClassificacao = {
  time: Time;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
};

export default function ClassificacaoPage() {
  const [times, setTimes] = useState<Time[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      { data: timesData, error: timesError },
      { data: jogosData, error: jogosError },
    ] = await Promise.all([
      supabase
        .from("times")
        .select("id, nome, sigla, escudo_url")
        .order("nome", { ascending: true }),

      supabase
        .from("jogos")
        .select(`
          id,
          time_casa_id,
          time_visitante_id,
          gols_casa,
          gols_visitante,
          status
        `)
        .eq("status", "finalizado"),
    ]);

    if (timesError) {
      console.error("Erro ao carregar times:", timesError);
      setErro(`Erro ao carregar times: ${timesError.message}`);
      setCarregando(false);
      return;
    }

    if (jogosError) {
      console.error("Erro ao carregar jogos:", jogosError);
      setErro(`Erro ao carregar jogos: ${jogosError.message}`);
      setCarregando(false);
      return;
    }

    setTimes(timesData ?? []);
    setJogos(jogosData ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const classificacao = useMemo(() => {
    const tabela = new Map<number, LinhaClassificacao>();

    times.forEach((time) => {
      tabela.set(time.id, {
        time,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldo: 0,
      });
    });

    jogos.forEach((jogo) => {
      const casa = tabela.get(jogo.time_casa_id);
      const visitante = tabela.get(jogo.time_visitante_id);

      if (!casa || !visitante) {
        return;
      }

      const golsCasa = Number(jogo.gols_casa ?? 0);
      const golsVisitante = Number(jogo.gols_visitante ?? 0);

      casa.jogos += 1;
      visitante.jogos += 1;

      casa.golsPro += golsCasa;
      casa.golsContra += golsVisitante;

      visitante.golsPro += golsVisitante;
      visitante.golsContra += golsCasa;

      if (golsCasa > golsVisitante) {
        casa.vitorias += 1;
        casa.pontos += 3;

        visitante.derrotas += 1;
      } else if (golsCasa < golsVisitante) {
        visitante.vitorias += 1;
        visitante.pontos += 3;

        casa.derrotas += 1;
      } else {
        casa.empates += 1;
        visitante.empates += 1;

        casa.pontos += 1;
        visitante.pontos += 1;
      }
    });

    const lista = Array.from(tabela.values()).map((linha) => ({
      ...linha,
      saldo: linha.golsPro - linha.golsContra,
    }));

    lista.sort((a, b) => {
      if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
      }

      if (b.vitorias !== a.vitorias) {
        return b.vitorias - a.vitorias;
      }

      if (b.saldo !== a.saldo) {
        return b.saldo - a.saldo;
      }

      if (b.golsPro !== a.golsPro) {
        return b.golsPro - a.golsPro;
      }

      return a.time.nome.localeCompare(b.time.nome);
    });

    return lista;
  }, [times, jogos]);

  function formatarSaldo(saldo: number) {
    if (saldo > 0) {
      return `+${saldo}`;
    }

    return String(saldo);
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
              Campeonato 2026
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Classificação
            </h1>

            <p className="mt-2 text-white/50">
              Atualizada automaticamente com os jogos finalizados.
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
              Carregando classificação...
            </div>
          ) : classificacao.length === 0 ? (
            <div className="p-10 text-center text-white/40">
              Nenhum time cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/35">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      #
                    </th>

                    <th className="px-4 py-4 text-left">
                      Time
                    </th>

                    <th className="px-4 py-4 text-center">
                      PTS
                    </th>

                    <th className="px-4 py-4 text-center">
                      J
                    </th>

                    <th className="px-4 py-4 text-center">
                      V
                    </th>

                    <th className="px-4 py-4 text-center">
                      E
                    </th>

                    <th className="px-4 py-4 text-center">
                      D
                    </th>

                    <th className="px-4 py-4 text-center">
                      GP
                    </th>

                    <th className="px-4 py-4 text-center">
                      GC
                    </th>

                    <th className="px-4 py-4 text-center">
                      SG
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {classificacao.map((linha, index) => (
                    <tr
                      key={linha.time.id}
                      className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                            index === 0
                              ? "bg-emerald-400 text-[#07111f]"
                              : "bg-white/5 text-white/60"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {linha.time.escudo_url ? (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 p-1">
                              <img
                                src={linha.time.escudo_url}
                                alt={linha.time.nome}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xs font-black text-white/50">
                              {linha.time.sigla?.slice(0, 3) || "FC"}
                            </div>
                          )}

                          <div>
                            <p className="font-bold">
                              {linha.time.nome}
                            </p>

                            {linha.time.sigla && (
                              <p className="text-xs text-white/35">
                                {linha.time.sigla}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center text-lg font-black text-emerald-300">
                        {linha.pontos}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.jogos}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.vitorias}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.empates}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.derrotas}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.golsPro}
                      </td>

                      <td className="px-4 py-4 text-center text-white/60">
                        {linha.golsContra}
                      </td>

                      <td
                        className={`px-4 py-4 text-center font-semibold ${
                          linha.saldo > 0
                            ? "text-emerald-300"
                            : linha.saldo < 0
                              ? "text-red-300"
                              : "text-white/60"
                        }`}
                      >
                        {formatarSaldo(linha.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs leading-6 text-white/40">
            Critérios usados nesta versão: pontos, vitórias, saldo de gols
            e gols marcados.
          </p>
        </div>
      </div>
    </main>
  );
}