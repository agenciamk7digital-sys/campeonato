"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

/* ============================================================
 * TIPOS
 * ============================================================ */

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

type JogadorRelacionado = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
};

type TimeRelacionado = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type EventoGol = {
  id: number;
  jogo_id: number | null;
  jogador_id: number | null;
  time_id: number | null;
  tipo: string;

  jogador:
    | JogadorRelacionado
    | JogadorRelacionado[]
    | null;

  time:
    | TimeRelacionado
    | TimeRelacionado[]
    | null;
};

type LinhaArtilharia = {
  jogador: JogadorRelacionado;
  time: TimeRelacionado | null;
  gols: number;
};

/* ============================================================
 * HOME
 * ============================================================ */

export default function Home() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [jogos, setJogos] =
    useState<Jogo[]>([]);

  const [eventosGol, setEventosGol] =
    useState<EventoGol[]>([]);

  const [
    campeonatoSelecionadoId,
    setCampeonatoSelecionadoId,
  ] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  /* ============================================================
   * CARREGAMENTO
   * ============================================================ */

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      campeonatosResponse,
      timesResponse,
      jogadoresResponse,
      jogosResponse,
      eventosResponse,
    ] = await Promise.all([
      supabase
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
        }),

      supabase
        .from("times")
        .select(`
          id,
          nome,
          sigla,
          escudo_url,
          campeonato_id
        `)
        .order("nome", {
          ascending: true,
        }),

      supabase
        .from("jogadores")
        .select(`
          id,
          nome,
          numero,
          foto_url,
          time_id
        `)
        .order("nome", {
          ascending: true,
        }),

      supabase
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
        .order("data_jogo", {
          ascending: true,
        })
        .order("horario", {
          ascending: true,
        }),

      supabase
        .from("eventos_jogo")
        .select(`
          id,
          jogo_id,
          jogador_id,
          time_id,
          tipo,

          jogador:jogadores (
            id,
            nome,
            numero,
            foto_url
          ),

          time:times (
            id,
            nome,
            sigla,
            escudo_url
          )
        `)
        .eq("tipo", "gol"),
    ]);

    if (campeonatosResponse.error) {
      setErro(
        `Erro ao carregar campeonatos: ${campeonatosResponse.error.message}`
      );

      setCarregando(false);
      return;
    }

    if (timesResponse.error) {
      setErro(
        `Erro ao carregar times: ${timesResponse.error.message}`
      );

      setCarregando(false);
      return;
    }

    if (jogadoresResponse.error) {
      setErro(
        `Erro ao carregar jogadores: ${jogadoresResponse.error.message}`
      );

      setCarregando(false);
      return;
    }

    if (jogosResponse.error) {
      setErro(
        `Erro ao carregar jogos: ${jogosResponse.error.message}`
      );

      setCarregando(false);
      return;
    }

    const listaCampeonatos =
      campeonatosResponse.data ?? [];

    setCampeonatos(
      listaCampeonatos
    );

    setTimes(
      timesResponse.data ?? []
    );

    setJogadores(
      jogadoresResponse.data ?? []
    );

    setJogos(
      (jogosResponse.data ??
        []) as unknown as Jogo[]
    );

    if (!eventosResponse.error) {
      setEventosGol(
        (eventosResponse.data ??
          []) as unknown as EventoGol[]
      );
    }

    if (
      listaCampeonatos.length >
      0
    ) {
      const ativo =
        listaCampeonatos.find(
          (campeonato) =>
            campeonato.status ===
            "ativo"
        ) ??
        listaCampeonatos[0];

      setCampeonatoSelecionadoId(
        (atual) =>
          atual ||
          String(ativo.id)
      );
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  /* ============================================================
   * RELAÇÕES
   * ============================================================ */

  function obterRelacao<T>(
    valor:
      | T
      | T[]
      | null
  ): T | null {
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

  /* ============================================================
   * CAMPEONATO SELECIONADO
   * ============================================================ */

  const campeonatoSelecionado =
    useMemo(() => {
      return (
        campeonatos.find(
          (campeonato) =>
            Number(
              campeonato.id
            ) ===
            Number(
              campeonatoSelecionadoId
            )
        ) ?? null
      );
    }, [
      campeonatos,
      campeonatoSelecionadoId,
    ]);

  const timesDoCampeonato =
    useMemo(() => {
      if (
        !campeonatoSelecionadoId
      ) {
        return [];
      }

      return times.filter(
        (time) =>
          Number(
            time.campeonato_id
          ) ===
          Number(
            campeonatoSelecionadoId
          )
      );
    }, [
      times,
      campeonatoSelecionadoId,
    ]);

  const jogadoresDoCampeonato =
    useMemo(() => {
      const idsTimes =
        new Set(
          timesDoCampeonato.map(
            (time) => time.id
          )
        );

      return jogadores.filter(
        (jogador) =>
          jogador.time_id !==
            null &&
          idsTimes.has(
            Number(
              jogador.time_id
            )
          )
      );
    }, [
      jogadores,
      timesDoCampeonato,
    ]);

  const jogosDoCampeonato =
    useMemo(() => {
      if (
        !campeonatoSelecionadoId
      ) {
        return [];
      }

      return jogos.filter(
        (jogo) =>
          Number(
            jogo.campeonato_id
          ) ===
          Number(
            campeonatoSelecionadoId
          )
      );
    }, [
      jogos,
      campeonatoSelecionadoId,
    ]);

  /* ============================================================
   * PRÓXIMOS JOGOS
   * ============================================================ */

  const proximosJogos =
    useMemo(() => {
      return jogosDoCampeonato
        .filter(
          (jogo) =>
            jogo.status ===
            "agendado"
        )
        .sort((a, b) => {
          const dataA =
            `${a.data_jogo ?? ""} ${a.horario ?? ""}`;

          const dataB =
            `${b.data_jogo ?? ""} ${b.horario ?? ""}`;

          return dataA.localeCompare(
            dataB
          );
        })
        .slice(0, 3);
    }, [jogosDoCampeonato]);

  /* ============================================================
   * RESULTADOS
   * ============================================================ */

  const ultimosResultados =
    useMemo(() => {
      return jogosDoCampeonato
        .filter(
          (jogo) =>
            jogo.status ===
            "finalizado"
        )
        .sort((a, b) => {
          const dataA =
            `${a.data_jogo ?? ""} ${a.horario ?? ""}`;

          const dataB =
            `${b.data_jogo ?? ""} ${b.horario ?? ""}`;

          return dataB.localeCompare(
            dataA
          );
        })
        .slice(0, 3);
    }, [jogosDoCampeonato]);

  /* ============================================================
   * ARTILHARIA
   * ============================================================ */

  const artilharia =
    useMemo<
      LinhaArtilharia[]
    >(() => {
      const idsJogos =
        new Set(
          jogosDoCampeonato.map(
            (jogo) => jogo.id
          )
        );

      const mapa =
        new Map<
          number,
          LinhaArtilharia
        >();

      eventosGol.forEach(
        (evento) => {
          if (
            evento.jogo_id ===
              null ||
            evento.jogador_id ===
              null ||
            !idsJogos.has(
              evento.jogo_id
            )
          ) {
            return;
          }

          const jogador =
            obterRelacao(
              evento.jogador
            );

          if (!jogador) {
            return;
          }

          const time =
            obterRelacao(
              evento.time
            );

          const atual =
            mapa.get(
              jogador.id
            );

          if (atual) {
            atual.gols += 1;
          } else {
            mapa.set(
              jogador.id,
              {
                jogador,
                time,
                gols: 1,
              }
            );
          }
        }
      );

      return Array.from(
        mapa.values()
      )
        .sort(
          (a, b) => {
            if (
              b.gols !==
              a.gols
            ) {
              return (
                b.gols -
                a.gols
              );
            }

            return a.jogador.nome.localeCompare(
              b.jogador.nome
            );
          }
        )
        .slice(0, 5);
    }, [
      eventosGol,
      jogosDoCampeonato,
    ]);

  /* ============================================================
   * FORMATAÇÃO
   * ============================================================ */

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

    if (
      !ano ||
      !mes ||
      !dia
    ) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataCurta(
    data: string | null
  ) {
    if (!data) {
      return {
        dia: "--",
        mes: "---",
      };
    }

    const [
      ,
      mes,
      dia,
    ] = data.split("-");

    const meses: Record<
      string,
      string
    > = {
      "01": "JAN",
      "02": "FEV",
      "03": "MAR",
      "04": "ABR",
      "05": "MAI",
      "06": "JUN",
      "07": "JUL",
      "08": "AGO",
      "09": "SET",
      "10": "OUT",
      "11": "NOV",
      "12": "DEZ",
    };

    return {
      dia:
        dia || "--",
      mes:
        meses[mes] ||
        "---",
    };
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

  /* ============================================================
   * LOADING
   * ============================================================ */

  if (carregando) {
    return (
      <main className="min-h-screen p-6 text-white">
        <div className="rounded-3xl border border-white/[0.07] bg-[#080D09] p-12 text-center text-white/40">
          Carregando painel...
        </div>
      </main>
    );
  }

  /* ============================================================
   * UI
   * ============================================================ */

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">

        {/* ================================================== */}
        {/* CABEÇALHO */}
        {/* ================================================== */}

        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-[28px] font-black leading-tight tracking-[-0.03em] sm:text-[32px]">
              Bem-vindo,{" "}
              <span className="text-[#18C929]">
                Administrador!
              </span>
            </h1>

            <p className="mt-1 text-[13px] text-white/40">
              Gerencie seus campeonatos e acompanhe tudo em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {campeonatos.length >
              0 && (
              <select
                value={
                  campeonatoSelecionadoId
                }
                onChange={(e) =>
                  setCampeonatoSelecionadoId(
                    e.target.value
                  )
                }
                className="h-12 min-w-[205px] rounded-xl border border-[#18C929]/20 bg-[#087A10] px-4 text-sm font-bold text-white outline-none transition focus:border-[#18C929]"
              >
                {campeonatos.map(
                  (campeonato) => (
                    <option
                      key={
                        campeonato.id
                      }
                      value={
                        campeonato.id
                      }
                    >
                      {
                        campeonato.nome
                      }

                      {campeonato.ano
                        ? ` ${campeonato.ano}`
                        : campeonato.temporada
                          ? ` ${campeonato.temporada}`
                          : ""}
                    </option>
                  )
                )}
              </select>
            )}

            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#080D09]">

              <Bell
                size={20}
                strokeWidth={1.8}
              />

              {proximosJogos.length >
                0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#18C929] px-1 text-[10px] font-black text-black">
                  {
                    proximosJogos.length
                  }
                </span>
              )}
            </div>
          </div>
        </header>

        {erro && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {/* ================================================== */}
        {/* GRID PRINCIPAL */}
        {/* ================================================== */}

        <div className="grid items-start gap-5 xl:grid-cols-[1.62fr_0.92fr]">

          {/* ================================================== */}
          {/* COLUNA ESQUERDA */}
          {/* ================================================== */}

          <div className="space-y-5">

            {/* INDICADORES */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

              <StatCard
                titulo="Campeonatos"
                valor={
                  campeonatos.length
                }
                descricao="Em andamento"
                icon={Trophy}
                href="/campeonatos"
              />

              <StatCard
                titulo="Times"
                valor={
                  timesDoCampeonato.length
                }
                descricao="Participantes"
                icon={Shield}
                href={
                  campeonatoSelecionado
                    ? `/admin/times?campeonato=${campeonatoSelecionado.id}`
                    : "/admin/times"
                }
              />

              <StatCard
                titulo="Jogadores"
                valor={
                  jogadoresDoCampeonato.length
                }
                descricao="Cadastrados"
                icon={Users}
                href={
                  campeonatoSelecionado
                    ? `/admin/jogadores?campeonato=${campeonatoSelecionado.id}`
                    : "/admin/jogadores"
                }
                className="col-span-2 lg:col-span-1"
              />
            </div>

            {/* ================================================== */}
            {/* BANNER */}
            {/* ================================================== */}

            <Link
              href={
                campeonatoSelecionado
                  ? `/campeonatos/${campeonatoSelecionado.id}`
                  : "/campeonatos"
              }
              className="group relative block h-[315px] overflow-hidden rounded-[22px] border border-[#18C929]/25 bg-black sm:h-[345px] lg:h-[365px]"
            >
              <Image
                src="/banner-fju.png"
                alt="Nascidos para vencer"
                fill
                priority
                className="object-cover object-center transition duration-500 group-hover:scale-[1.01]"
              />

              <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/[0.04]" />
            </Link>

            {/* ================================================== */}
            {/* CAMPEONATOS EM DESTAQUE */}
            {/* ================================================== */}

            <section className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#080D09]">

              <SectionHeader
                titulo="Campeonatos em Destaque"
                href="/campeonatos"
              />

              {campeonatos.length ===
              0 ? (
                <div className="px-4 pb-4">
                  <EmptyState texto="Nenhum campeonato cadastrado." />
                </div>
              ) : (
                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">

                  {campeonatos
                    .slice(0, 4)
                    .map(
                      (
                        campeonato
                      ) => (
                        <Link
                          key={
                            campeonato.id
                          }
                          href={`/campeonatos/${campeonato.id}`}
                          className="group rounded-xl border border-white/[0.07] bg-[#0A0F0B] p-3 text-center transition hover:border-[#18C929]/30 hover:bg-[#0B120C]"
                        >

                          <div className="flex h-[94px] items-center justify-center">

                            {campeonato.logo_url ? (
                              <img
                                src={
                                  campeonato.logo_url
                                }
                                alt={
                                  campeonato.nome
                                }
                                className="h-[82px] w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-[#18C929]/10">
                                <Trophy
                                  size={36}
                                  className="text-[#18C929]"
                                />
                              </div>
                            )}
                          </div>

                          <h3 className="mt-2 line-clamp-2 min-h-9 text-sm font-black leading-[18px]">
                            {
                              campeonato.nome
                            }
                          </h3>

                          <p className="mt-1 text-[11px] text-white/40">
                            {campeonato.ano ||
                              campeonato.temporada ||
                              "Temporada"}
                          </p>

                          <span className="mt-2 inline-flex rounded-lg bg-[#087A10]/40 px-2.5 py-1 text-[9px] font-black uppercase text-[#32E13C]">
                            {campeonato.status ||
                              "ativo"}
                          </span>
                        </Link>
                      )
                    )}
                </div>
              )}
            </section>
          </div>

          {/* ================================================== */}
          {/* COLUNA DIREITA */}
          {/* ================================================== */}

          <div className="space-y-5">

            {/* PRÓXIMOS JOGOS */}

            <section className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#080D09]">

              <SectionHeader
                titulo="Próximos Jogos"
                icon={
                  CalendarDays
                }
                href={
                  campeonatoSelecionado
                    ? `/admin/jogos?campeonato=${campeonatoSelecionado.id}`
                    : "/admin/jogos"
                }
              />

              <div className="space-y-2.5 px-4 pb-4">

                {proximosJogos.length ===
                0 ? (
                  <EmptyState texto="Nenhuma partida agendada." />
                ) : (
                  proximosJogos.map(
                    (jogo) => {
                      const casa =
                        obterRelacao(
                          jogo.time_casa
                        );

                      const visitante =
                        obterRelacao(
                          jogo.time_visitante
                        );

                      const data =
                        formatarDataCurta(
                          jogo.data_jogo
                        );

                      return (
                        <div
                          key={
                            jogo.id
                          }
                          className="rounded-xl border border-white/[0.07] bg-[#0A0F0B] px-3 py-3"
                        >

                          <div className="grid grid-cols-[54px_1fr] items-center gap-3">

                            <div className="flex h-full min-h-[84px] flex-col items-center justify-center border-r border-white/[0.07] pr-3">

                              <strong className="text-xl font-black leading-none">
                                {
                                  data.dia
                                }
                              </strong>

                              <span className="mt-1 text-[9px] font-black uppercase text-white/35">
                                {
                                  data.mes
                                }
                              </span>
                            </div>

                            <div>
                              <div className="grid grid-cols-[1fr_20px_1fr] items-start gap-2">

                                <TimeMini
                                  time={
                                    casa
                                  }
                                />

                                <div className="pt-5 text-center text-xs font-black text-white/25">
                                  X
                                </div>

                                <TimeMini
                                  time={
                                    visitante
                                  }
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-center gap-2 text-[9px] text-white/30">

                                {jogo.horario && (
                                  <span>
                                    {formatarHorario(
                                      jogo.horario
                                    )}
                                  </span>
                                )}

                                {jogo.horario &&
                                  jogo.local && (
                                    <span>
                                      •
                                    </span>
                                  )}

                                {jogo.local && (
                                  <span className="max-w-[160px] truncate">
                                    {
                                      jogo.local
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>

            {/* ARTILHARIA */}

            <section className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#080D09]">

              <SectionHeader
                titulo="Artilharia"
                icon={Trophy}
                href={
                  campeonatoSelecionado
                    ? `/artilharia?campeonato=${campeonatoSelecionado.id}`
                    : "/artilharia"
                }
              />

              {artilharia.length ===
              0 ? (
                <div className="px-4 pb-4">
                  <EmptyState texto="Nenhum gol registrado." />
                </div>
              ) : (
                <div className="px-4 pb-3">

                  {artilharia.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.jogador.id
                        }
                        className="flex min-h-[62px] items-center gap-3 border-b border-white/[0.06] px-1 py-2.5 last:border-b-0"
                      >

                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                            index ===
                            0
                              ? "bg-[#18C929] text-black"
                              : "text-white/45"
                          }`}
                        >
                          {index +
                            1}
                        </span>

                        {item.jogador
                          .foto_url ? (
                          <img
                            src={
                              item
                                .jogador
                                .foto_url
                            }
                            alt={
                              item
                                .jogador
                                .nome
                            }
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04]">
                            <UserRound
                              size={
                                17
                              }
                              className="text-white/30"
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[13px] font-bold">
                            {
                              item
                                .jogador
                                .nome
                            }
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-white/35">
                            {item.time
                              ?.nome ||
                              "Time"}
                          </p>
                        </div>

                        <div className="min-w-[40px] text-right">

                          <strong className="text-lg font-black leading-none text-[#18C929]">
                            {
                              item.gols
                            }
                          </strong>

                          <p className="mt-1 text-[8px] text-white/30">
                            gols
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* RESULTADOS */}

            <section className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#080D09]">

              <SectionHeader
                titulo="Últimos Resultados"
                href={
                  campeonatoSelecionado
                    ? `/admin/jogos?campeonato=${campeonatoSelecionado.id}`
                    : "/admin/jogos"
                }
              />

              <div className="space-y-2.5 px-4 pb-4">

                {ultimosResultados.length ===
                0 ? (
                  <EmptyState texto="Nenhum resultado disponível." />
                ) : (
                  ultimosResultados.map(
                    (jogo) => {
                      const casa =
                        obterRelacao(
                          jogo.time_casa
                        );

                      const visitante =
                        obterRelacao(
                          jogo.time_visitante
                        );

                      return (
                        <div
                          key={
                            jogo.id
                          }
                          className="rounded-xl border border-white/[0.06] bg-[#0A0F0B] p-3"
                        >

                          <p className="mb-2 text-[9px] text-white/30">
                            {formatarData(
                              jogo.data_jogo
                            )}
                          </p>

                          <ResultadoLinha
                            time={
                              casa
                            }
                            gols={
                              jogo.gols_casa ??
                              0
                            }
                          />

                          <div className="my-1.5 border-t border-white/[0.05]" />

                          <ResultadoLinha
                            time={
                              visitante
                            }
                            gols={
                              jogo.gols_visitante ??
                              0
                            }
                          />
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
 * STAT CARD
 * ============================================================ */

function StatCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
  href,
  className = "",
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: typeof Trophy;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group min-h-[112px] rounded-[18px] border border-white/[0.07] bg-[#080D09] p-4 transition hover:border-[#18C929]/25 hover:bg-[#0A110B] ${className}`}
    >
      <div className="flex h-full items-center gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A2F0D] text-[#18C929]">
          <Icon
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">

          <p className="text-[28px] font-black leading-none">
            {valor}
          </p>

          <p className="mt-1.5 truncate text-[13px] font-bold">
            {titulo}
          </p>

          <p className="mt-1 text-[10px] text-white/30">
            {descricao}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
 * HEADER DE SEÇÃO
 * ============================================================ */

function SectionHeader({
  titulo,
  href,
  icon: Icon,
}: {
  titulo: string;
  href: string;
  icon?: typeof Trophy;
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-4">

      <div className="flex items-center gap-2.5">

        {Icon && (
          <Icon
            size={18}
            className="text-[#18C929]"
          />
        )}

        <h2 className="text-[16px] font-black">
          {titulo}
        </h2>
      </div>

      <Link
        href={href}
        className="flex items-center gap-1 text-[10px] font-bold text-[#18C929] transition hover:text-[#39E443]"
      >
        Ver todos

        <ChevronRight
          size={13}
        />
      </Link>
    </div>
  );
}

/* ============================================================
 * TIME MINI
 * ============================================================ */

function TimeMini({
  time,
}: {
  time: Time | null;
}) {
  return (
    <div className="min-w-0 text-center">

      <Escudo
        time={time}
        tamanho="md"
      />

      <p className="mt-1.5 truncate text-[10px] font-bold">
        {time?.nome ||
          "Time"}
      </p>
    </div>
  );
}

/* ============================================================
 * RESULTADO
 * ============================================================ */

function ResultadoLinha({
  time,
  gols,
}: {
  time: Time | null;
  gols: number;
}) {
  return (
    <div className="flex min-h-[34px] items-center gap-2.5">

      <Escudo
        time={time}
        tamanho="xs"
      />

      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
        {time?.nome ||
          "Time"}
      </span>

      <strong className="flex h-7 min-w-7 items-center justify-center rounded-md bg-white/[0.05] px-2 text-[13px]">
        {gols}
      </strong>
    </div>
  );
}

/* ============================================================
 * ESCUDO
 * ============================================================ */

function Escudo({
  time,
  tamanho,
}: {
  time: Time | null;
  tamanho:
    | "xs"
    | "md";
}) {
  const classe =
    tamanho === "md"
      ? "h-11 w-11"
      : "h-7 w-7";

  if (
    time?.escudo_url
  ) {
    return (
      <div
        className={`${classe} mx-auto shrink-0 rounded-lg bg-white/[0.04] p-1`}
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
      className={`${classe} mx-auto flex shrink-0 items-center justify-center rounded-lg bg-[#18C929]/10 text-[8px] font-black text-[#18C929]`}
    >
      {time?.sigla?.slice(
        0,
        3
      ) || (
        <Shield
          size={13}
        />
      )}
    </div>
  );
}

/* ============================================================
 * ESTADO VAZIO
 * ============================================================ */

function EmptyState({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.01] px-4 py-5 text-center">

      <Trophy
        size={21}
        className="text-white/15"
      />

      <p className="mt-2 text-[11px] text-white/30">
        {texto}
      </p>
    </div>
  );
}