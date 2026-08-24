"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Goal,
  Shield,
  Trophy,
  UserRound,
  Users,
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

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
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

type Jogo = {
  id: number;
  campeonato_id: number | null;
  time_casa_id: number;
  time_visitante_id: number;
  gols_casa: number | null;
  gols_visitante: number | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;

  time_casa:
    | Time
    | Time[]
    | null;

  time_visitante:
    | Time
    | Time[]
    | null;
};

type EventoGol = {
  id: number;
  jogo_id: number | null;
  jogador_id: number | null;
  tipo: string;
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

type Artilheiro = {
  jogador: Jogador;
  time: Time | null;
  gols: number;
};

export default function CampeonatoPage() {
  const params = useParams();
  const id = Number(params.id);

  const [campeonato, setCampeonato] =
    useState<Campeonato | null>(null);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [jogos, setJogos] =
    useState<Jogo[]>([]);

  const [eventosGol, setEventosGol] =
    useState<EventoGol[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    if (!id || Number.isNaN(id)) {
      setErro("Campeonato inválido.");
      setCarregando(false);
      return;
    }

    const {
      data: campeonatoData,
      error: campeonatoError,
    } = await supabase
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
      .eq("id", id)
      .single();

    if (campeonatoError) {
      console.error(
        "Erro ao carregar campeonato:",
        campeonatoError
      );

      setErro(
        `Erro ao carregar campeonato: ${campeonatoError.message}`
      );

      setCarregando(false);
      return;
    }

    const {
      data: timesData,
      error: timesError,
    } = await supabase
      .from("times")
      .select(`
        id,
        nome,
        sigla,
        escudo_url,
        campeonato_id
      `)
      .eq("campeonato_id", id)
      .order("nome", {
        ascending: true,
      });

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

    const listaTimes =
      timesData ?? [];

    const idsTimes =
      listaTimes.map(
        (time) => time.id
      );

    let jogadoresData:
      Jogador[] = [];

    if (idsTimes.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("jogadores")
        .select(`
          id,
          nome,
          numero,
          foto_url,
          time_id
        `)
        .in(
          "time_id",
          idsTimes
        )
        .order("nome", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Erro ao carregar jogadores:",
          error
        );

        setErro(
          `Erro ao carregar jogadores: ${error.message}`
        );

        setCarregando(false);
        return;
      }

      jogadoresData =
        data ?? [];
    }

    const {
      data: jogosData,
      error: jogosError,
    } = await supabase
      .from("jogos")
      .select(`
        id,
        campeonato_id,
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
          escudo_url,
          campeonato_id
        ),

        time_visitante:times!jogos_time_visitante_id_fkey (
          id,
          nome,
          sigla,
          escudo_url,
          campeonato_id
        )
      `)
      .eq("campeonato_id", id)
      .order("data_jogo", {
        ascending: true,
      })
      .order("horario", {
        ascending: true,
      });

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

    const listaJogos =
      (jogosData ?? []) as unknown as Jogo[];

    const idsJogos =
      listaJogos.map(
        (jogo) => jogo.id
      );

    let eventosData:
      EventoGol[] = [];

    if (idsJogos.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("eventos_jogo")
        .select(`
          id,
          jogo_id,
          jogador_id,
          tipo
        `)
        .eq("tipo", "gol")
        .in(
          "jogo_id",
          idsJogos
        );

      if (error) {
        console.error(
          "Erro ao carregar gols:",
          error
        );
      } else {
        eventosData =
          (data ?? []) as EventoGol[];
      }
    }

    setCampeonato(
      campeonatoData
    );

    setTimes(listaTimes);
    setJogadores(
      jogadoresData
    );
    setJogos(
      listaJogos
    );
    setEventosGol(
      eventosData
    );

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  function obterTime(
    valor:
      | Time
      | Time[]
      | null
  ): Time | null {
    if (!valor) {
      return null;
    }

    if (
      Array.isArray(valor)
    ) {
      return valor[0] ?? null;
    }

    return valor;
  }

  const classificacao =
    useMemo(() => {
      const tabela =
        new Map<
          number,
          LinhaClassificacao
        >();

      times.forEach(
        (time) => {
          tabela.set(
            time.id,
            {
              time,
              pontos: 0,
              jogos: 0,
              vitorias: 0,
              empates: 0,
              derrotas: 0,
              golsPro: 0,
              golsContra: 0,
              saldo: 0,
            }
          );
        }
      );

      jogos
        .filter(
          (jogo) =>
            jogo.status ===
            "finalizado"
        )
        .forEach(
          (jogo) => {
            const casa =
              tabela.get(
                jogo.time_casa_id
              );

            const visitante =
              tabela.get(
                jogo.time_visitante_id
              );

            if (
              !casa ||
              !visitante
            ) {
              return;
            }

            const golsCasa =
              Number(
                jogo.gols_casa ??
                  0
              );

            const golsVisitante =
              Number(
                jogo.gols_visitante ??
                  0
              );

            casa.jogos++;
            visitante.jogos++;

            casa.golsPro +=
              golsCasa;

            casa.golsContra +=
              golsVisitante;

            visitante.golsPro +=
              golsVisitante;

            visitante.golsContra +=
              golsCasa;

            if (
              golsCasa >
              golsVisitante
            ) {
              casa.vitorias++;
              casa.pontos += 3;
              visitante.derrotas++;
            } else if (
              golsCasa <
              golsVisitante
            ) {
              visitante.vitorias++;
              visitante.pontos += 3;
              casa.derrotas++;
            } else {
              casa.empates++;
              visitante.empates++;

              casa.pontos++;
              visitante.pontos++;
            }
          }
        );

      return Array.from(
        tabela.values()
      )
        .map(
          (linha) => ({
            ...linha,
            saldo:
              linha.golsPro -
              linha.golsContra,
          })
        )
        .sort(
          (a, b) => {
            if (
              b.pontos !==
              a.pontos
            ) {
              return (
                b.pontos -
                a.pontos
              );
            }

            if (
              b.vitorias !==
              a.vitorias
            ) {
              return (
                b.vitorias -
                a.vitorias
              );
            }

            if (
              b.saldo !==
              a.saldo
            ) {
              return (
                b.saldo -
                a.saldo
              );
            }

            return (
              b.golsPro -
              a.golsPro
            );
          }
        );
    }, [
      times,
      jogos,
    ]);

  const artilheiro =
    useMemo<Artilheiro | null>(
      () => {
        if (
          eventosGol.length ===
          0
        ) {
          return null;
        }

        const gols =
          new Map<
            number,
            number
          >();

        eventosGol.forEach(
          (evento) => {
            if (
              !evento.jogador_id
            ) {
              return;
            }

            gols.set(
              evento.jogador_id,
              (gols.get(
                evento.jogador_id
              ) ?? 0) + 1
            );
          }
        );

        let melhor:
          Artilheiro | null =
          null;

        jogadores.forEach(
          (jogador) => {
            const quantidade =
              gols.get(
                jogador.id
              ) ?? 0;

            if (
              quantidade === 0
            ) {
              return;
            }

            const time =
              times.find(
                (item) =>
                  item.id ===
                  jogador.time_id
              ) ?? null;

            if (
              !melhor ||
              quantidade >
                melhor.gols
            ) {
              melhor = {
                jogador,
                time,
                gols:
                  quantidade,
              };
            }
          }
        );

        return melhor;
      },
      [
        eventosGol,
        jogadores,
        times,
      ]
    );

  const proximosJogos =
    useMemo(() => {
      return jogos
        .filter(
          (jogo) =>
            jogo.status ===
            "agendado"
        )
        .slice(0, 3);
    }, [jogos]);

  const ultimosResultados =
    useMemo(() => {
      return [...jogos]
        .filter(
          (jogo) =>
            jogo.status ===
            "finalizado"
        )
        .reverse()
        .slice(0, 3);
    }, [jogos]);

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return "";
    }

    const [
      ano,
      mes,
      dia,
    ] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(
    horario: string | null
  ) {
    if (!horario) {
      return "";
    }

    return horario.slice(
      0,
      5
    );
  }

  if (carregando) {
    return (
      <main className="p-8 text-white">
        Carregando campeonato...
      </main>
    );
  }

  if (
    erro ||
    !campeonato
  ) {
    return (
      <main className="p-8">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {erro ||
            "Campeonato não encontrado."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[30px] border border-[#18C929]/20 bg-[#071208]">
          <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full bg-[#18C929]/10 blur-[90px]" />

          <div className="relative flex flex-col gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[26px] border border-white/[0.08] bg-black/20 p-4">
                {campeonato.logo_url ? (
                  <img
                    src={
                      campeonato.logo_url
                    }
                    alt={
                      campeonato.nome
                    }
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Trophy
                    size={55}
                    className="text-[#18C929]"
                  />
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#18C929]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#18C929]">
                    {campeonato.status ||
                      "ativo"}
                  </span>

                  {(campeonato.ano ||
                    campeonato.temporada) && (
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-white/40">
                      Temporada{" "}
                      {campeonato.ano ||
                        campeonato.temporada}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {
                    campeonato.nome
                  }
                </h1>

                {campeonato.descricao && (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
                    {
                      campeonato.descricao
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* INDICADORES */}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador
            titulo="Times"
            valor={
              times.length
            }
            icon={Shield}
          />

          <Indicador
            titulo="Jogadores"
            valor={
              jogadores.length
            }
            icon={Users}
          />

          <Indicador
            titulo="Jogos"
            valor={
              jogos.length
            }
            icon={
              CalendarDays
            }
          />

          <Indicador
            titulo="Gols"
            valor={
              eventosGol.length
            }
            icon={Goal}
          />
        </div>

        {/* ATALHOS */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Atalho
            titulo="Times"
            descricao="Cadastrar e gerenciar equipes"
            href={`/admin/times?campeonato=${campeonato.id}`}
            icon={Shield}
          />

          <Atalho
            titulo="Jogadores"
            descricao="Elencos do campeonato"
            href={`/admin/jogadores?campeonato=${campeonato.id}`}
            icon={UserRound}
          />

          <Atalho
            titulo="Jogos"
            descricao="Partidas e resultados"
            href={`/admin/jogos?campeonato=${campeonato.id}`}
            icon={CalendarDays}
          />

          <Atalho
            titulo="Eventos"
            descricao="Gols, assistências e cartões"
            href={`/admin/eventos?campeonato=${campeonato.id}`}
            icon={Goal}
          />

          <Atalho
            titulo="Classificação"
            descricao="Tabela completa"
            href={`/classificacao?campeonato=${campeonato.id}`}
            icon={BarChart3}
          />

          <Atalho
            titulo="Artilharia"
            descricao="Ranking de goleadores"
            href={`/artilharia?campeonato=${campeonato.id}`}
            icon={Trophy}
          />
        </div>

        {/* CONTEÚDO */}

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">

          {/* COLUNA ESQUERDA */}

          <div className="space-y-5">

            {/* PRÓXIMOS JOGOS */}

            <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    Próximos jogos
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Partidas agendadas
                  </p>
                </div>

                <CalendarDays
                  size={20}
                  className="text-[#18C929]"
                />
              </div>

              {proximosJogos.length ===
              0 ? (
                <Vazio texto="Nenhuma partida agendada." />
              ) : (
                <div className="space-y-3">
                  {proximosJogos.map(
                    (jogo) => (
                      <JogoCard
                        key={jogo.id}
                        jogo={jogo}
                        formatarData={
                          formatarData
                        }
                        formatarHorario={
                          formatarHorario
                        }
                        obterTime={
                          obterTime
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* CLASSIFICAÇÃO */}

            <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    Classificação
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Primeiras posições
                  </p>
                </div>

                <Link
                  href={`/classificacao?campeonato=${campeonato.id}`}
                  className="text-xs font-bold text-[#18C929]"
                >
                  Ver tabela
                </Link>
              </div>

              {classificacao.length ===
              0 ? (
                <Vazio texto="Nenhum time cadastrado." />
              ) : (
                <div className="space-y-2">
                  {classificacao
                    .slice(0, 5)
                    .map(
                      (
                        linha,
                        index
                      ) => (
                        <div
                          key={
                            linha.time.id
                          }
                          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                              index === 0
                                ? "bg-[#18C929] text-black"
                                : "bg-white/[0.05] text-white/45"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <Escudo
                            time={
                              linha.time
                            }
                          />

                          <span className="min-w-0 flex-1 truncate text-sm font-bold">
                            {
                              linha.time
                                .nome
                            }
                          </span>

                          <div className="text-right">
                            <p className="font-black text-[#18C929]">
                              {
                                linha.pontos
                              }
                            </p>

                            <p className="text-[10px] uppercase text-white/25">
                              pts
                            </p>
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </section>
          </div>

          {/* COLUNA DIREITA */}

          <div className="space-y-5">

            {/* ARTILHEIRO */}

            <section className="relative overflow-hidden rounded-[24px] border border-[#18C929]/20 bg-[#071208] p-6">
              <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#18C929]/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#18C929]">
                      Artilheiro
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Destaque
                    </h2>
                  </div>

                  <Trophy
                    size={27}
                    className="text-[#18C929]"
                  />
                </div>

                {artilheiro ? (
                  <div className="mt-6 flex items-center gap-4">
                    {artilheiro
                      .jogador
                      .foto_url ? (
                      <img
                        src={
                          artilheiro
                            .jogador
                            .foto_url
                        }
                        alt={
                          artilheiro
                            .jogador
                            .nome
                        }
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#18C929]/10 text-2xl font-black text-[#18C929]">
                        {artilheiro
                          .jogador
                          .numero ||
                          "?"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black">
                        {
                          artilheiro
                            .jogador
                            .nome
                        }
                      </h3>

                      {artilheiro.time && (
                        <p className="mt-1 truncate text-sm text-white/40">
                          {
                            artilheiro
                              .time
                              .nome
                          }
                        </p>
                      )}

                      <p className="mt-3 text-3xl font-black text-[#18C929]">
                        {
                          artilheiro.gols
                        }{" "}
                        <span className="text-sm font-bold text-white/35">
                          {artilheiro.gols ===
                          1
                            ? "gol"
                            : "gols"}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
                    Nenhum gol registrado ainda.
                  </div>
                )}

                <Link
                  href={`/artilharia?campeonato=${campeonato.id}`}
                  className="mt-5 flex items-center justify-between rounded-xl bg-[#18C929]/10 px-4 py-3 text-sm font-black text-[#18C929]"
                >
                  Ver artilharia completa
                  <ChevronRight
                    size={17}
                  />
                </Link>
              </div>
            </section>

            {/* RESULTADOS */}

            <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black">
                  Últimos resultados
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Partidas finalizadas
                </p>
              </div>

              {ultimosResultados.length ===
              0 ? (
                <Vazio texto="Nenhum resultado disponível." />
              ) : (
                <div className="space-y-3">
                  {ultimosResultados.map(
                    (jogo) => (
                      <ResultadoCard
                        key={jogo.id}
                        jogo={jogo}
                        formatarData={
                          formatarData
                        }
                        obterTime={
                          obterTime
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Indicador({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  icon: typeof Trophy;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
        <Icon size={20} />
      </div>

      <p className="mt-5 text-3xl font-black">
        {valor}
      </p>

      <p className="mt-1 text-sm font-bold text-white/50">
        {titulo}
      </p>
    </div>
  );
}

function Atalho({
  titulo,
  descricao,
  href,
  icon: Icon,
}: {
  titulo: string;
  descricao: string;
  href: string;
  icon: typeof Trophy;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[20px] border border-white/[0.07] bg-[#080D09] p-4 transition hover:border-[#18C929]/25"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black">
          {titulo}
        </p>

        <p className="mt-0.5 truncate text-xs text-white/30">
          {descricao}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="text-white/20 transition group-hover:text-[#18C929]"
      />
    </Link>
  );
}

function JogoCard({
  jogo,
  formatarData,
  formatarHorario,
  obterTime,
}: {
  jogo: Jogo;
  formatarData: (
    data: string | null
  ) => string;
  formatarHorario: (
    horario: string | null
  ) => string;
  obterTime: (
    valor:
      | Time
      | Time[]
      | null
  ) => Time | null;
}) {
  const casa =
    obterTime(
      jogo.time_casa
    );

  const visitante =
    obterTime(
      jogo.time_visitante
    );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <p className="mb-4 text-xs text-white/30">
        {formatarData(
          jogo.data_jogo
        )}
        {jogo.horario
          ? ` • ${formatarHorario(
              jogo.horario
            )}`
          : ""}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TimeJogo
          time={casa}
        />

        <span className="rounded-xl bg-black/30 px-3 py-2 text-sm font-black text-white/40">
          VS
        </span>

        <TimeJogo
          time={visitante}
        />
      </div>
    </div>
  );
}

function ResultadoCard({
  jogo,
  formatarData,
  obterTime,
}: {
  jogo: Jogo;
  formatarData: (
    data: string | null
  ) => string;
  obterTime: (
    valor:
      | Time
      | Time[]
      | null
  ) => Time | null;
}) {
  const casa =
    obterTime(
      jogo.time_casa
    );

  const visitante =
    obterTime(
      jogo.time_visitante
    );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <p className="mb-4 text-xs text-white/25">
        {formatarData(
          jogo.data_jogo
        )}
      </p>

      <LinhaResultado
        time={casa}
        gols={
          jogo.gols_casa ??
          0
        }
      />

      <div className="my-2 border-t border-white/[0.05]" />

      <LinhaResultado
        time={visitante}
        gols={
          jogo.gols_visitante ??
          0
        }
      />
    </div>
  );
}

function LinhaResultado({
  time,
  gols,
}: {
  time: Time | null;
  gols: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Escudo time={time} />

      <span className="min-w-0 flex-1 truncate text-sm font-bold">
        {time?.nome ||
          "Time"}
      </span>

      <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/[0.05] px-2 font-black">
        {gols}
      </span>
    </div>
  );
}

function TimeJogo({
  time,
}: {
  time: Time | null;
}) {
  return (
    <div className="min-w-0 text-center">
      <Escudo
        time={time}
        grande
      />

      <p className="mt-2 truncate text-sm font-black">
        {time?.nome ||
          "Time"}
      </p>
    </div>
  );
}

function Escudo({
  time,
  grande = false,
}: {
  time: Time | null;
  grande?: boolean;
}) {
  const tamanho =
    grande
      ? "h-12 w-12"
      : "h-8 w-8";

  if (time?.escudo_url) {
    return (
      <div
        className={`${tamanho} shrink-0 rounded-xl bg-white/[0.04] p-1`}
      >
        <img
          src={
            time.escudo_url
          }
          alt={time.nome}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${tamanho} flex shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-black text-white/35`}
    >
      {time?.sigla?.slice(
        0,
        2
      ) || "FC"}
    </div>
  );
}

function Vazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] p-7 text-center text-sm text-white/30">
      {texto}
    </div>
  );
}