"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Trophy,
  UserRound,
} from "lucide-react";

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

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  time_id: number | null;

  times:
    | Time
    | Time[]
    | null;
};

type EventoGol = {
  id: number;
  jogo_id: number | null;
  jogador_id: number | null;
  time_id: number | null;
  tipo: string;
  minuto: number | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;
};

type LinhaArtilharia = {
  jogador: Jogador;
  time: Time | null;
  gols: number;
};

export default function ArtilhariaPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [eventos, setEventos] =
    useState<EventoGol[]>([]);

  const [jogos, setJogos] =
    useState<Jogo[]>([]);

  const [
    campeonatoId,
    setCampeonatoId,
  ] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      {
        data: campeonatosData,
        error: campeonatosError,
      },
      {
        data: jogadoresData,
        error: jogadoresError,
      },
      {
        data: eventosData,
        error: eventosError,
      },
      {
        data: jogosData,
        error: jogosError,
      },
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
        .order("ano", {
          ascending: false,
        })
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
          time_id,

          times (
            id,
            nome,
            sigla,
            escudo_url,
            campeonato_id
          )
        `)
        .order("nome", {
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
          minuto
        `)
        .eq("tipo", "gol"),

      supabase
        .from("jogos")
        .select(`
          id,
          campeonato_id
        `),
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

    if (jogadoresError) {
      console.error(
        "Erro ao carregar jogadores:",
        jogadoresError
      );

      setErro(
        `Erro ao carregar jogadores: ${jogadoresError.message}`
      );

      setCarregando(false);
      return;
    }

    if (eventosError) {
      console.error(
        "Erro ao carregar gols:",
        eventosError
      );

      setErro(
        `Erro ao carregar gols: ${eventosError.message}`
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

    setCampeonatos(
      campeonatosData ?? []
    );

    setJogadores(
      (jogadoresData ?? []) as unknown as Jogador[]
    );

    setEventos(
      (eventosData ?? []) as EventoGol[]
    );

    setJogos(
      (jogosData ?? []) as Jogo[]
    );

    setCarregando(false);
  }

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const campeonatoUrl =
      parametros.get(
        "campeonato"
      ) || "";

    if (campeonatoUrl) {
      setCampeonatoId(
        campeonatoUrl
      );
    }

    carregarDados();
  }, []);

  const campeonatoSelecionado =
    useMemo(() => {
      if (!campeonatoId) {
        return null;
      }

      return (
        campeonatos.find(
          (campeonato) =>
            Number(
              campeonato.id
            ) ===
            Number(
              campeonatoId
            )
        ) ?? null
      );
    }, [
      campeonatos,
      campeonatoId,
    ]);

  function obterTime(
    jogador: Jogador
  ): Time | null {
    if (!jogador.times) {
      return null;
    }

    if (
      Array.isArray(
        jogador.times
      )
    ) {
      return (
        jogador.times[0] ??
        null
      );
    }

    return jogador.times;
  }

  const idsJogosDoCampeonato =
    useMemo(() => {
      if (!campeonatoId) {
        return new Set<number>();
      }

      return new Set(
        jogos
          .filter(
            (jogo) =>
              Number(
                jogo.campeonato_id
              ) ===
              Number(
                campeonatoId
              )
          )
          .map(
            (jogo) => jogo.id
          )
      );
    }, [
      jogos,
      campeonatoId,
    ]);

  const jogadoresDoCampeonato =
    useMemo(() => {
      if (!campeonatoId) {
        return [];
      }

      return jogadores.filter(
        (jogador) => {
          const time =
            obterTime(jogador);

          return (
            Number(
              time?.campeonato_id
            ) ===
            Number(
              campeonatoId
            )
          );
        }
      );
    }, [
      jogadores,
      campeonatoId,
    ]);

  const eventosDoCampeonato =
    useMemo(() => {
      if (!campeonatoId) {
        return [];
      }

      return eventos.filter(
        (evento) =>
          evento.jogo_id !==
            null &&
          idsJogosDoCampeonato.has(
            evento.jogo_id
          )
      );
    }, [
      eventos,
      campeonatoId,
      idsJogosDoCampeonato,
    ]);

  const artilharia =
    useMemo(() => {
      const golsPorJogador =
        new Map<
          number,
          number
        >();

      eventosDoCampeonato.forEach(
        (evento) => {
          if (
            !evento.jogador_id
          ) {
            return;
          }

          const atual =
            golsPorJogador.get(
              evento.jogador_id
            ) ?? 0;

          golsPorJogador.set(
            evento.jogador_id,
            atual + 1
          );
        }
      );

      const lista:
        LinhaArtilharia[] =
        jogadoresDoCampeonato
          .map(
            (jogador) => {
              const time =
                obterTime(
                  jogador
                );

              return {
                jogador,
                time,
                gols:
                  golsPorJogador.get(
                    jogador.id
                  ) ?? 0,
              };
            }
          )
          .filter(
            (item) =>
              item.gols > 0
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
          );

      return lista;
    }, [
      jogadoresDoCampeonato,
      eventosDoCampeonato,
    ]);

  function selecionarCampeonato(
    valor: string
  ) {
    setCampeonatoId(valor);

    const url =
      new URL(
        window.location.href
      );

    if (valor) {
      url.searchParams.set(
        "campeonato",
        valor
      );
    } else {
      url.searchParams.delete(
        "campeonato"
      );
    }

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  const temporada =
    campeonatoSelecionado
      ? campeonatoSelecionado.ano ??
        campeonatoSelecionado.temporada
      : null;

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex items-start gap-4">

            {campeonatoSelecionado?.logo_url ? (
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 sm:flex">
                <img
                  src={
                    campeonatoSelecionado.logo_url
                  }
                  alt={
                    campeonatoSelecionado.nome
                  }
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#18C929]/20 bg-[#18C929]/10 text-[#18C929] sm:flex">
                <Trophy
                  size={32}
                />
              </div>
            )}

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
                {campeonatoSelecionado
                  ? temporada
                    ? `${campeonatoSelecionado.nome} • ${temporada}`
                    : campeonatoSelecionado.nome
                  : "FJU Esportes"}
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Artilharia
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
                Ranking calculado
                automaticamente pelos
                gols registrados nas
                partidas deste
                campeonato.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

            <div className="w-full sm:w-72">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                Campeonato
              </label>

              <select
                value={
                  campeonatoId
                }
                onChange={(e) =>
                  selecionarCampeonato(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm text-white outline-none focus:border-[#18C929]"
              >
                <option value="">
                  Selecione o campeonato
                </option>

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
                        ? ` - ${campeonato.ano}`
                        : campeonato.temporada
                          ? ` - ${campeonato.temporada}`
                          : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={
                carregarDados
              }
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
            >
              <RefreshCw
                size={16}
              />

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
              Selecione um
              campeonato
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Escolha o campeonato
              acima para visualizar
              a artilharia.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D1F12]">

            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-black">
                    {campeonatoSelecionado?.nome ||
                      "Artilharia"}
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    {
                      jogadoresDoCampeonato.length
                    }{" "}
                    jogador(es) •{" "}
                    {
                      eventosDoCampeonato.length
                    }{" "}
                    gol(s)
                    registrado(s)
                  </p>
                </div>

                {temporada && (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-[#18C929]/20 bg-[#18C929]/10 px-3 py-1 text-xs font-bold text-[#18C929] sm:mt-0">
                    {temporada}
                  </span>
                )}
              </div>
            </div>

            {carregando ? (
              <div className="p-10 text-center text-white/40">
                Carregando
                artilharia...
              </div>
            ) : artilharia.length ===
              0 ? (
              <div className="p-10 text-center">

                <UserRound
                  size={38}
                  className="mx-auto text-white/20"
                />

                <h3 className="mt-4 font-black">
                  Nenhum gol
                  registrado ainda
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                  Os jogadores
                  aparecerão aqui
                  automaticamente
                  quando os gols forem
                  registrados nos
                  eventos das partidas.
                </p>
              </div>
            ) : (
              <div>
                {artilharia.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.jogador.id
                      }
                      className="flex flex-col gap-4 border-b border-white/[0.06] p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            index ===
                            0
                              ? "bg-[#18C929] text-black"
                              : "bg-white/5 text-white/60"
                          }`}
                        >
                          {index +
                            1}
                        </div>

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
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18C929]/10 text-xl font-black text-[#18C929]">
                            {item
                              .jogador
                              .numero ||
                              "?"}
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-2">

                            <h2 className="text-lg font-bold">
                              {
                                item
                                  .jogador
                                  .nome
                              }
                            </h2>

                            {item
                              .jogador
                              .numero && (
                              <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-white/50">
                                #
                                {
                                  item
                                    .jogador
                                    .numero
                                }
                              </span>
                            )}
                          </div>

                          {item.time && (
                            <div className="mt-2 flex items-center gap-2">

                              {item
                                .time
                                .escudo_url ? (
                                <img
                                  src={
                                    item
                                      .time
                                      .escudo_url
                                  }
                                  alt={
                                    item
                                      .time
                                      .nome
                                  }
                                  className="h-5 w-5 object-contain"
                                />
                              ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#18C929]/10 text-[8px] font-black text-[#18C929]">
                                  {item
                                    .time
                                    .sigla?.slice(
                                      0,
                                      2
                                    ) ||
                                    "FC"}
                                </div>
                              )}

                              <span className="text-sm text-white/45">
                                {
                                  item
                                    .time
                                    .nome
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 sm:text-right">

                        <span className="text-4xl font-black text-[#18C929]">
                          {
                            item.gols
                          }
                        </span>

                        <span className="text-sm text-white/40">
                          {item.gols ===
                          1
                            ? "gol"
                            : "gols"}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}