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
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;
  time_casa: Time[] | null;
  time_visitante: Time[] | null;
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

export default function Home() {
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
          data_jogo,
          horario,
          local,
          status,
          time_casa:times!jogos_time_casa_id_fkey (
            id,
            nome,
            sigla,
            escudo_url
          ),
          time_visitante:times!jogos_time_visitante_id_fkey (
            id,
            nome,
            sigla,
            escudo_url
          )
        `)
        .order("data_jogo", { ascending: true })
        .order("horario", { ascending: true }),
    ]);

    if (timesError) {
      console.error(timesError);
      setErro(`Erro ao carregar times: ${timesError.message}`);
      setCarregando(false);
      return;
    }

    if (jogosError) {
      console.error(jogosError);
      setErro(`Erro ao carregar jogos: ${jogosError.message}`);
      setCarregando(false);
      return;
    }

    setTimes(timesData ?? []);
    setJogos((jogosData ?? []) as unknown as Jogo[]);
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

    jogos
      .filter((jogo) => jogo.status === "finalizado")
      .forEach((jogo) => {
        const casa = tabela.get(jogo.time_casa_id);
        const visitante = tabela.get(jogo.time_visitante_id);

        if (!casa || !visitante) return;

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

    return Array.from(tabela.values())
      .map((linha) => ({
        ...linha,
        saldo: linha.golsPro - linha.golsContra,
      }))
      .sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        if (b.saldo !== a.saldo) return b.saldo - a.saldo;
        if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
        return a.time.nome.localeCompare(b.time.nome);
      });
  }, [times, jogos]);

  const proximosJogos = useMemo(() => {
    return jogos
      .filter((jogo) => jogo.status === "agendado")
      .sort((a, b) => {
        const dataA = `${a.data_jogo ?? ""} ${a.horario ?? ""}`;
        const dataB = `${b.data_jogo ?? ""} ${b.horario ?? ""}`;
        return dataA.localeCompare(dataB);
      });
  }, [jogos]);

  const proximoJogo = proximosJogos[0] ?? null;

  const ultimosResultados = useMemo(() => {
    return jogos
      .filter((jogo) => jogo.status === "finalizado")
      .sort((a, b) => {
        const dataA = `${a.data_jogo ?? ""} ${a.horario ?? ""}`;
        const dataB = `${b.data_jogo ?? ""} ${b.horario ?? ""}`;
        return dataB.localeCompare(dataA);
      })
      .slice(0, 3);
  }, [jogos]);

  function obterTime(relacao: Time[] | null) {
    if (!relacao || relacao.length === 0) return null;
    return relacao[0];
  }

  function formatarData(data: string | null) {
    if (!data) return "Data não informada";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(horario: string | null) {
    if (!horario) return "";
    return horario.slice(0, 5);
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#0b1728]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Campeonato 2026</h1>
            <p className="text-sm text-white/50">
              Resultados, classificação e estatísticas
            </p>
          </div>

          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="/" className="text-white">
              Início
            </a>

            <a href="/jogos">Jogos</a>

            <a href="/classificacao">
              Classificação
            </a>

            <a href="/artilharia">
              Artilharia
            </a>

            <a href="/times">
              Times
            </a>

            <a href="/jogadores">
              Jogadores
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {erro && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-10 text-center text-white/40">
            Carregando campeonato...
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-8 lg:col-span-2">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Próxima partida
                </p>

                <h2 className="text-4xl font-black md:text-5xl">
                  A bola vai rolar
                </h2>

                <p className="mt-4 max-w-xl text-white/60">
                  Acompanhe os próximos jogos, resultados e estatísticas completas do campeonato.
                </p>

                {proximoJogo ? (
                  <div className="mt-8 rounded-2xl bg-white/5 p-6">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                      <TimePartida
                        time={obterTime(proximoJogo.time_casa)}
                      />

                      <div className="text-center">
                        <p className="text-sm text-white/40">
                          {formatarData(proximoJogo.data_jogo)}
                          {proximoJogo.horario
                            ? ` • ${formatarHorario(proximoJogo.horario)}`
                            : ""}
                        </p>

                        <p className="my-2 text-3xl font-black">
                          X
                        </p>

                        <p className="text-sm text-white/40">
                          {proximoJogo.local || "Local não informado"}
                        </p>
                      </div>

                      <TimePartida
                        time={obterTime(proximoJogo.time_visitante)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">
                    Nenhuma partida agendada.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Artilheiro
                </p>

                <div className="mt-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white/40">
                    ⚽
                  </div>

                  <h3 className="mt-4 text-2xl font-bold">
                    Em breve
                  </h3>

                  <p className="mt-1 text-white/50">
                    Vamos calcular automaticamente pelos gols dos jogadores.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Classificação
                  </h2>

                  <a
                    href="/classificacao"
                    className="text-sm font-semibold text-emerald-400"
                  >
                    Ver completa
                  </a>
                </div>

                {classificacao.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">
                    Nenhum time cadastrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-white/40">
                        <tr>
                          <th className="pb-4">#</th>
                          <th className="pb-4">Time</th>
                          <th className="pb-4 text-center">PTS</th>
                          <th className="pb-4 text-center">J</th>
                          <th className="pb-4 text-center">V</th>
                          <th className="pb-4 text-center">E</th>
                          <th className="pb-4 text-center">D</th>
                          <th className="pb-4 text-center">SG</th>
                        </tr>
                      </thead>

                      <tbody>
                        {classificacao
                          .slice(0, 5)
                          .map((linha, index) => (
                            <tr
                              key={linha.time.id}
                              className="border-t border-white/10"
                            >
                              <td className="py-4">
                                {index + 1}
                              </td>

                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  {linha.time.escudo_url ? (
                                    <img
                                      src={linha.time.escudo_url}
                                      alt={linha.time.nome}
                                      className="h-8 w-8 object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-black text-white/50">
                                      {linha.time.sigla?.slice(0, 2) || "FC"}
                                    </div>
                                  )}

                                  <span className="font-semibold">
                                    {linha.time.nome}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 text-center font-black text-emerald-300">
                                {linha.pontos}
                              </td>

                              <td className="py-4 text-center text-white/60">
                                {linha.jogos}
                              </td>

                              <td className="py-4 text-center text-white/60">
                                {linha.vitorias}
                              </td>

                              <td className="py-4 text-center text-white/60">
                                {linha.empates}
                              </td>

                              <td className="py-4 text-center text-white/60">
                                {linha.derrotas}
                              </td>

                              <td className="py-4 text-center text-white/60">
                                {linha.saldo > 0
                                  ? `+${linha.saldo}`
                                  : linha.saldo}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
                <h2 className="text-xl font-bold">
                  Últimos resultados
                </h2>

                {ultimosResultados.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">
                    Nenhum resultado disponível.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {ultimosResultados.map((jogo) => {
                      const casa = obterTime(jogo.time_casa);
                      const visitante = obterTime(jogo.time_visitante);

                      return (
                        <div
                          key={jogo.id}
                          className="rounded-2xl bg-white/5 p-4"
                        >
                          <p className="mb-3 text-xs text-white/35">
                            {formatarData(jogo.data_jogo)}
                          </p>

                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate">
                              {casa?.nome || "Time"}
                            </span>

                            <strong>
                              {jogo.gols_casa ?? 0}
                            </strong>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="truncate">
                              {visitante?.nome || "Time"}
                            </span>

                            <strong>
                              {jogo.gols_visitante ?? 0}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function TimePartida({
  time,
}: {
  time: Time | null;
}) {
  return (
    <div className="text-center">
      {time?.escudo_url ? (
        <img
          src={time.escudo_url}
          alt={time.nome}
          className="mx-auto h-16 w-16 object-contain"
        />
      ) : (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-black text-white/50">
          {time?.sigla?.slice(0, 2) || "FC"}
        </div>
      )}

      <p className="mt-3 font-semibold">
        {time?.nome || "Time"}
      </p>
    </div>
  );
}