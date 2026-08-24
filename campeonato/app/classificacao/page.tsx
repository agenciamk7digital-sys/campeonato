"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  logo_url: string | null;
};

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;
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
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);

  const [campeonatoId, setCampeonatoId] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      { data: campeonatosData, error: campeonatosError },
      { data: timesData, error: timesError },
      { data: jogosData, error: jogosError },
    ] = await Promise.all([
      supabase
        .from("campeonatos")
        .select(`
          id,
          nome,
          temporada,
          ano,
          logo_url
        `)
        .order("ano", { ascending: false })
        .order("nome", { ascending: true }),

      supabase
        .from("times")
        .select(`
          id,
          nome,
          sigla,
          escudo_url,
          campeonato_id
        `)
        .order("nome", { ascending: true }),

      supabase
        .from("jogos")
        .select(`
          id,
          campeonato_id,
          time_casa_id,
          time_visitante_id,
          gols_casa,
          gols_visitante,
          status
        `)
        .eq("status", "finalizado"),
    ]);

    if (campeonatosError) {
      console.error(
        "Erro ao carregar campeonatos:",
        campeonatosError
      );

      setErro(
        `Erro ao carregar campeonatos: ${campeonatosError.message}`
      );

      setCarregando(false);
      return;
    }

    if (timesError) {
      console.error(
        "Erro ao carregar times:",
        timesError
      );

      setErro(
        `Erro ao carregar times: ${timesError.message}`
      );

      setCarregando(false);
      return;
    }

    if (jogosError) {
      console.error(
        "Erro ao carregar jogos:",
        jogosError
      );

      setErro(
        `Erro ao carregar jogos: ${jogosError.message}`
      );

      setCarregando(false);
      return;
    }

    setCampeonatos(campeonatosData ?? []);
    setTimes(timesData ?? []);
    setJogos(jogosData ?? []);

    setCarregando(false);
  }

  useEffect(() => {
    const parametros = new URLSearchParams(
      window.location.search
    );

    const campeonatoUrl =
      parametros.get("campeonato") || "";

    if (campeonatoUrl) {
      setCampeonatoId(campeonatoUrl);
    }

    carregarDados();
  }, []);

  const campeonatoSelecionado = useMemo(() => {
    if (!campeonatoId) {
      return null;
    }

    return (
      campeonatos.find(
        (campeonato) =>
          Number(campeonato.id) === Number(campeonatoId)
      ) ?? null
    );
  }, [campeonatos, campeonatoId]);

  const timesFiltrados = useMemo(() => {
    if (!campeonatoId) {
      return [];
    }

    return times.filter(
      (time) =>
        Number(time.campeonato_id) === Number(campeonatoId)
    );
  }, [times, campeonatoId]);

  const jogosFiltrados = useMemo(() => {
    if (!campeonatoId) {
      return [];
    }

    return jogos.filter(
      (jogo) =>
        Number(jogo.campeonato_id) === Number(campeonatoId)
    );
  }, [jogos, campeonatoId]);

  const classificacao = useMemo(() => {
    const tabela = new Map<number, LinhaClassificacao>();

    timesFiltrados.forEach((time) => {
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

    jogosFiltrados.forEach((jogo) => {
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
  }, [timesFiltrados, jogosFiltrados]);

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

  function formatarSaldo(saldo: number) {
    if (saldo > 0) {
      return `+${saldo}`;
    }

    return String(saldo);
  }

  const subtituloCampeonato = campeonatoSelecionado
    ? campeonatoSelecionado.ano ??
      campeonatoSelecionado.temporada
    : null;

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex items-start gap-4">
            {campeonatoSelecionado?.logo_url ? (
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 sm:flex">
                <img
                  src={campeonatoSelecionado.logo_url}
                  alt={campeonatoSelecionado.nome}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#18C929]/20 bg-[#18C929]/10 text-[#18C929] sm:flex">
                <Trophy size={32} />
              </div>
            )}

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
                {campeonatoSelecionado
                  ? subtituloCampeonato
                    ? `${campeonatoSelecionado.nome} • ${subtituloCampeonato}`
                    : campeonatoSelecionado.nome
                  : "FJU Esportes"}
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Classificação
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
                Tabela atualizada automaticamente com os resultados
                das partidas finalizadas.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

            <div className="w-full sm:w-72">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                Campeonato
              </label>

              <select
                value={campeonatoId}
                onChange={(e) =>
                  selecionarCampeonato(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm text-white outline-none focus:border-[#18C929]"
              >
                <option value="">
                  Selecione o campeonato
                </option>

                {campeonatos.map((campeonato) => (
                  <option
                    key={campeonato.id}
                    value={campeonato.id}
                  >
                    {campeonato.nome}

                    {campeonato.ano
                      ? ` - ${campeonato.ano}`
                      : campeonato.temporada
                        ? ` - ${campeonato.temporada}`
                        : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={carregarDados}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {!campeonatoId ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-[#0D1F12] p-10 text-center sm:p-16">
            <Trophy
              size={42}
              className="mx-auto text-[#18C929]/50"
            />

            <h2 className="mt-5 text-xl font-black">
              Selecione um campeonato
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Escolha o campeonato acima para visualizar a tabela
              de classificação.
            </p>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D1F12]">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-black">
                      {campeonatoSelecionado?.nome ||
                        "Classificação"}
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      {timesFiltrados.length} time(s) •{" "}
                      {jogosFiltrados.length} jogo(s) finalizado(s)
                    </p>
                  </div>

                  {subtituloCampeonato && (
                    <span className="mt-2 inline-flex w-fit rounded-full border border-[#18C929]/20 bg-[#18C929]/10 px-3 py-1 text-xs font-bold text-[#18C929] sm:mt-0">
                      {subtituloCampeonato}
                    </span>
                  )}
                </div>
              </div>

              {carregando ? (
                <div className="p-10 text-center text-white/40">
                  Carregando classificação...
                </div>
              ) : classificacao.length === 0 ? (
                <div className="p-10 text-center text-white/40">
                  Nenhum time cadastrado neste campeonato.
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
                                  ? "bg-[#18C929] text-black"
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
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#18C929]/10 text-xs font-black text-[#18C929]">
                                  {linha.time.sigla?.slice(0, 3) ||
                                    "FC"}
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

                          <td className="px-4 py-4 text-center text-lg font-black text-[#18C929]">
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
                                ? "text-[#18C929]"
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
                Critérios de classificação: pontos, vitórias,
                saldo de gols e gols marcados.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}