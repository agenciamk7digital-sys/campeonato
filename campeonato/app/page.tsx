"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Goal,
  Medal,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type FaseMataMata =
  | "preliminar"
  | "dezesseis_avos"
  | "oitavas"
  | "quartas"
  | "semifinal"
  | "final";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  descricao: string | null;
  logo_url: string | null;
  status: string | null;
  formato:
    | "pontos_corridos"
    | "mata_mata";
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
  foto_url: string | null;
  time_id: number | null;
};

type TimeRelacionado = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;

  time_casa_id: number | null;
  time_visitante_id: number | null;

  gols_casa: number | null;
  gols_visitante: number | null;

  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;

  fase: FaseMataMata | null;
  grupo_confronto: number | null;
  perna: "ida" | "volta" | null;

  vencedor_id: number | null;
  eliminado_id: number | null;
  tipo_resultado: string | null;

  time_casa:
    | TimeRelacionado
    | TimeRelacionado[]
    | null;

  time_visitante:
    | TimeRelacionado
    | TimeRelacionado[]
    | null;
};

type EventoGol = {
  id: number;
  jogador_id: number | null;
  jogo_id: number | null;
};

type Artilheiro = {
  jogador: Jogador;
  time: Time | null;
  gols: number;
};

const FASES: {
  value: FaseMataMata;
  label: string;
  curta: string;
}[] = [
  {
    value: "preliminar",
    label: "Fase preliminar",
    curta: "Preliminar",
  },
  {
    value: "dezesseis_avos",
    label: "16 avos de final",
    curta: "16 avos",
  },
  {
    value: "oitavas",
    label: "Oitavas de final",
    curta: "Oitavas",
  },
  {
    value: "quartas",
    label: "Quartas de final",
    curta: "Quartas",
  },
  {
    value: "semifinal",
    label: "Semifinal",
    curta: "Semi",
  },
  {
    value: "final",
    label: "Final",
    curta: "Final",
  },
];

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

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      campeonatosResponse,
      timesResponse,
      jogadoresResponse,
      jogosResponse,
      golsResponse,
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
          status,
          formato
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
          fase,
          grupo_confronto,
          perna,
          vencedor_id,
          eliminado_id,
          tipo_resultado,

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
          jogador_id,
          jogo_id
        `)
        .eq("tipo", "gol"),
    ]);

    if (
      campeonatosResponse.error
    ) {
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
      (campeonatosResponse.data ??
        []) as Campeonato[];

    setCampeonatos(
      listaCampeonatos
    );

    setTimes(
      (timesResponse.data ??
        []) as Time[]
    );

    setJogadores(
      (jogadoresResponse.data ??
        []) as Jogador[]
    );

    setJogos(
      (jogosResponse.data ??
        []) as unknown as Jogo[]
    );

    if (!golsResponse.error) {
      setEventosGol(
        (golsResponse.data ??
          []) as EventoGol[]
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
        String(ativo.id)
      );
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const campeonatoSelecionado =
    useMemo(() => {
      if (
        !campeonatoSelecionadoId
      ) {
        return null;
      }

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

  const idsTimesDoCampeonato =
    useMemo(
      () =>
        new Set(
          timesDoCampeonato.map(
            (time) => time.id
          )
        ),
      [timesDoCampeonato]
    );

  const jogadoresDoCampeonato =
    useMemo(() => {
      return jogadores.filter(
        (jogador) =>
          jogador.time_id !==
            null &&
          idsTimesDoCampeonato.has(
            jogador.time_id
          )
      );
    }, [
      jogadores,
      idsTimesDoCampeonato,
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

  const proximosJogos =
    useMemo(() => {
      return jogosDoCampeonato
        .filter(
          (jogo) =>
            jogo.status ===
            "agendado"
        )
        .sort((a, b) => {
          const aValor =
            `${a.data_jogo ?? ""} ${a.horario ?? ""}`;

          const bValor =
            `${b.data_jogo ?? ""} ${b.horario ?? ""}`;

          return aValor.localeCompare(
            bValor
          );
        })
        .slice(0, 3);
    }, [jogosDoCampeonato]);

  const ultimosResultados =
    useMemo(() => {
      return jogosDoCampeonato
        .filter(
          (jogo) =>
            jogo.status ===
            "finalizado"
        )
        .sort((a, b) => {
          const aValor =
            `${a.data_jogo ?? ""} ${a.horario ?? ""}`;

          const bValor =
            `${b.data_jogo ?? ""} ${b.horario ?? ""}`;

          return bValor.localeCompare(
            aValor
          );
        })
        .slice(0, 4);
    }, [jogosDoCampeonato]);

  function confrontoDecidido(
    jogo: Jogo
  ) {
    return (
      jogo.status ===
        "finalizado" &&
      Boolean(
        jogo.vencedor_id
      ) &&
      (
        jogo.tipo_resultado ===
          "wo" ||
        jogo.perna ===
          "volta"
      )
    );
  }

  const faseAtual =
    useMemo<FaseMataMata>(() => {
      const fasesComJogos =
        FASES.filter(
          (fase) =>
            jogosDoCampeonato.some(
              (jogo) =>
                jogo.fase ===
                fase.value
            )
        );

      if (
        fasesComJogos.length === 0
      ) {
        return "preliminar";
      }

      return fasesComJogos[
        fasesComJogos.length - 1
      ].value;
    }, [jogosDoCampeonato]);

  const jogosFaseAtual =
    useMemo(() => {
      return jogosDoCampeonato.filter(
        (jogo) =>
          jogo.fase === faseAtual
      );
    }, [
      jogosDoCampeonato,
      faseAtual,
    ]);

  const totalConfrontosFaseAtual =
    useMemo(() => {
      const grupos =
        jogosFaseAtual
          .map(
            (jogo) =>
              jogo.grupo_confronto
          )
          .filter(
            (
              valor
            ): valor is number =>
              valor !== null
          );

      return new Set(
        grupos
      ).size;
    }, [jogosFaseAtual]);

  const confrontosDecididos =
    useMemo(() => {
      return new Set(
        jogosFaseAtual
          .filter(
            confrontoDecidido
          )
          .map(
            (jogo) =>
              jogo.grupo_confronto
          )
          .filter(
            (
              valor
            ): valor is number =>
              valor !== null
          )
      ).size;
    }, [jogosFaseAtual]);

  const classificadosDiretos =
    useMemo(() => {
      const ids = Array.from(
        new Set(
          jogosDoCampeonato
            .filter(
              (jogo) =>
                jogo.fase ===
                  "preliminar" &&
                confrontoDecidido(
                  jogo
                )
            )
            .map(
              (jogo) =>
                jogo.vencedor_id
            )
            .filter(
              (
                valor
              ): valor is number =>
                Boolean(valor)
            )
        )
      );

      return ids
        .map((id) => {
          const time =
            timesDoCampeonato.find(
              (item) =>
                item.id === id
            );

          if (!time) {
            return null;
          }

          const decisao =
            jogosDoCampeonato.find(
              (jogo) =>
                jogo.fase ===
                  "preliminar" &&
                confrontoDecidido(
                  jogo
                ) &&
                jogo.vencedor_id ===
                  id
            );

          return {
            time,
            origem:
              decisao?.tipo_resultado ===
              "wo"
                ? "Classificado por W.O."
                : `Vencedor do confronto ${
                    decisao?.grupo_confronto ??
                    ""
                  }`,
          };
        })
        .filter(
          (
            item
          ): item is {
            time: Time;
            origem: string;
          } => Boolean(item)
        );
    }, [
      jogosDoCampeonato,
      timesDoCampeonato,
    ]);

  const artilheiro =
    useMemo<Artilheiro | null>(
      () => {
        const idsJogos =
          new Set(
            jogosDoCampeonato.map(
              (jogo) => jogo.id
            )
          );

        const golsValidos =
          eventosGol.filter(
            (evento) =>
              evento.jogo_id !==
                null &&
              idsJogos.has(
                evento.jogo_id
              ) &&
              evento.jogador_id !==
                null
          );

        if (
          golsValidos.length === 0
        ) {
          return null;
        }

        const contagem =
          new Map<number, number>();

        golsValidos.forEach(
          (evento) => {
            if (
              evento.jogador_id ===
              null
            ) {
              return;
            }

            contagem.set(
              evento.jogador_id,
              (contagem.get(
                evento.jogador_id
              ) ?? 0) + 1
            );
          }
        );

        let melhor:
          Artilheiro | null =
          null;

        jogadoresDoCampeonato.forEach(
          (jogador) => {
            const gols =
              contagem.get(
                jogador.id
              ) ?? 0;

            if (gols === 0) {
              return;
            }

            if (
              !melhor ||
              gols > melhor.gols
            ) {
              melhor = {
                jogador,
                gols,
                time:
                  timesDoCampeonato.find(
                    (time) =>
                      time.id ===
                      jogador.time_id
                  ) ?? null,
              };
            }
          }
        );

        return melhor;
      },
      [
        eventosGol,
        jogosDoCampeonato,
        jogadoresDoCampeonato,
        timesDoCampeonato,
      ]
    );

  function obterTime(
    valor:
      | TimeRelacionado
      | TimeRelacionado[]
      | null
  ) {
    if (!valor) {
      return null;
    }

    if (
      Array.isArray(valor)
    ) {
      return (
        valor[0] ?? null
      );
    }

    return valor;
  }

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
      dia: dia ?? "--",
      mes:
        meses[mes] ??
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

  const nomeFaseAtual =
    FASES.find(
      (item) =>
        item.value === faseAtual
    )?.label ??
    "Fase preliminar";

  const proximoJogo =
    proximosJogos[0] ??
    null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1580px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* CABEÇALHO */}
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Bem-vindo,{" "}
              <span className="text-[#18C929]">
                Administrador!
              </span>
            </h1>

            <p className="mt-1.5 text-xs text-white/35 sm:text-sm">
              Gerencie seus campeonatos e acompanhe tudo em tempo real.
            </p>
          </div>

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
              className="min-w-[220px] rounded-xl border border-[#18C929]/20 bg-[#0B7F19] px-4 py-3 text-sm font-black text-white outline-none transition focus:border-[#18C929]"
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
        </div>

        {erro && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-3xl border border-white/[0.07] bg-[#080D09] p-12 text-center text-white/40">
            Carregando painel...
          </div>
        ) : !campeonatoSelecionado ? (
          <EmptyState texto="Nenhum campeonato cadastrado." />
        ) : (
          <>
            {/* INDICADORES */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard
                titulo="Campeonatos"
                valor={
                  campeonatos.length
                }
                descricao="em andamento"
                icon={Trophy}
                href="/campeonatos"
              />

              <StatCard
                titulo="Times"
                valor={
                  timesDoCampeonato.length
                }
                descricao="participantes"
                icon={Shield}
                href={`/admin/times?campeonato=${campeonatoSelecionado.id}`}
              />

              <StatCard
                titulo="Jogos"
                valor={
                  jogosDoCampeonato.length
                }
                descricao="cadastrados"
                icon={
                  CalendarDays
                }
                href={`/admin/jogos?campeonato=${campeonatoSelecionado.id}`}
              />

              <StatCard
                titulo="Classificados"
                valor={
                  classificadosDiretos.length
                }
                descricao="direto até agora"
                icon={
                  CheckCircle2
                }
                href={`/campeonatos/${campeonatoSelecionado.id}#mata-mata`}
              />

              <StatCard
                titulo={
                  proximoJogo
                    ? "Próximo jogo"
                    : "Jogadores"
                }
                valor={
                  proximoJogo
                    ? `${
                        formatarDataCurta(
                          proximoJogo.data_jogo
                        ).dia
                      } ${
                        formatarDataCurta(
                          proximoJogo.data_jogo
                        ).mes
                      }`
                    : jogadoresDoCampeonato.length
                }
                descricao={
                  proximoJogo
                    ? formatarHorario(
                        proximoJogo.horario
                      )
                      ? `${formatarHorario(
                          proximoJogo.horario
                        )} • próxima partida`
                      : "próxima partida"
                    : "cadastrados"
                }
                icon={
                  proximoJogo
                    ? CalendarDays
                    : Users
                }
                href={
                  proximoJogo
                    ? `/admin/jogos?campeonato=${campeonatoSelecionado.id}`
                    : `/admin/jogadores?campeonato=${campeonatoSelecionado.id}`
                }
              />
            </div>

            {/* CAMPEONATO PRINCIPAL */}
            <section className="mt-4 overflow-hidden rounded-[24px] border border-[#18C929]/20 bg-[#071208]">
              <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 p-2">
                    {campeonatoSelecionado.logo_url ? (
                      <img
                        src={
                          campeonatoSelecionado.logo_url
                        }
                        alt={
                          campeonatoSelecionado.nome
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Trophy
                        size={38}
                        className="text-[#18C929]"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#18C929]/10 px-2.5 py-1 text-[10px] font-black uppercase text-[#18C929]">
                        {campeonatoSelecionado.status ??
                          "ativo"}
                      </span>

                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold text-white/40">
                        {campeonatoSelecionado.ano ??
                          campeonatoSelecionado.temporada ??
                          "Temporada atual"}
                      </span>
                    </div>

                    <h2 className="mt-1.5 truncate text-xl font-black sm:text-2xl">
                      {
                        campeonatoSelecionado.nome
                      }
                    </h2>

                    <p className="mt-1 text-xs text-white/35">
                      Fase atual:{" "}
                      <strong className="text-white/70">
                        {
                          nomeFaseAtual
                        }
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <MiniResumo
                    valor={
                      totalConfrontosFaseAtual
                    }
                    texto="confrontos"
                  />

                  <MiniResumo
                    valor={
                      confrontosDecididos
                    }
                    texto="decididos"
                    destaque
                  />

                  <MiniResumo
                    valor={
                      Math.max(
                        totalConfrontosFaseAtual -
                          confrontosDecididos,
                        0
                      )
                    }
                    texto="em aberto"
                  />
                </div>
              </div>

              {/* PROGRESSO */}
              {campeonatoSelecionado.formato ===
                "mata_mata" && (
                <div className="border-t border-white/[0.06] px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-max items-center xl:min-w-0 xl:w-full xl:justify-between overflow-x-auto pb-0.5">
                    {FASES.map(
                      (
                        fase,
                        index
                      ) => {
                        const indiceAtual =
                          FASES.findIndex(
                            (item) =>
                              item.value ===
                              faseAtual
                          );

                        const passou =
                          index <
                          indiceAtual;

                        const atual =
                          fase.value ===
                          faseAtual;

                        return (
                          <div
                            key={
                              fase.value
                            }
                            className="flex shrink-0 items-center xl:flex-1 xl:last:flex-none"
                          >
                            <div
                              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px] font-black uppercase tracking-wide ${
                                atual
                                  ? "border-[#18C929]/30 bg-[#18C929] text-black"
                                  : passou
                                    ? "border-[#18C929]/20 bg-[#18C929]/10 text-[#18C929]"
                                    : "border-white/[0.07] bg-white/[0.025] text-white/25"
                              }`}
                            >
                              {passou ? (
                                <CheckCircle2
                                  size={
                                    13
                                  }
                                />
                              ) : (
                                <CircleDot
                                  size={
                                    13
                                  }
                                />
                              )}

                              {
                                fase.curta
                              }
                            </div>

                            {index <
                              FASES.length -
                                1 && (
                              <div className="mx-2 h-[2px] w-7 rounded-full bg-white/[0.10] xl:flex-1" />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
              <div className="space-y-4">
                {/* PRÓXIMOS JOGOS */}
                <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09]">
                  <SectionHeader
                    titulo="Próximos jogos"
                    descricao="Partidas agendadas"
                    href={`/admin/jogos?campeonato=${campeonatoSelecionado.id}`}
                  />

                  <div
                    className={`grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5 ${
                      proximosJogos.length > 1
                        ? "md:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {proximosJogos.length ===
                    0 ? (
                      <EmptyState texto="Nenhuma partida agendada." />
                    ) : (
                      proximosJogos.map(
                        (jogo) => (
                          <ProximoJogo
                            key={
                              jogo.id
                            }
                            jogo={
                              jogo
                            }
                            casa={
                              obterTime(
                                jogo.time_casa
                              )
                            }
                            visitante={
                              obterTime(
                                jogo.time_visitante
                              )
                            }
                            formatarData={
                              formatarData
                            }
                            formatarHorario={
                              formatarHorario
                            }
                          />
                        )
                      )
                    )}
                  </div>
                </section>

                {/* CLASSIFICADOS PARA A PRÓXIMA FASE */}
                <section className="overflow-hidden rounded-[24px] border border-[#18C929]/15 bg-[#080D09]">
                  <div className="flex flex-col gap-3 border-b border-white/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18C929]/10 text-[#18C929]">
                          <CheckCircle2
                            size={16}
                          />
                        </div>

                        <div>
                          <h2 className="text-base font-black">
                            Classificados para a próxima fase
                          </h2>

                          <p className="mt-0.5 text-[10px] text-white/25">
                            {classificadosDiretos.length} vaga
                            {classificadosDiretos.length === 1
                              ? ""
                              : "s"}{" "}
                            garantida
                            {classificadosDiretos.length === 1
                              ? ""
                              : "s"}{" "}
                            até agora
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/campeonatos/${campeonatoSelecionado.id}#mata-mata`}
                      className="flex w-fit items-center gap-1 text-[10px] font-black text-[#18C929]"
                    >
                      Ver todos
                      <ChevronRight
                        size={13}
                      />
                    </Link>
                  </div>

                  <div className="px-4 py-4 sm:px-5">
                    {classificadosDiretos.length ===
                    0 ? (
                      <EmptyState texto="Nenhum confronto decidido ainda." />
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {classificadosDiretos
                          .slice(
                            0,
                            6
                          )
                          .map(
                            ({
                              time,
                              origem,
                            }) => (
                              <div
                                key={
                                  time.id
                                }
                                className="group flex items-center gap-3 rounded-xl border border-[#18C929]/10 bg-[#18C929]/[0.035] p-3 transition hover:border-[#18C929]/25"
                              >
                                <div className="relative shrink-0">
                                  <Escudo
                                    time={
                                      time
                                    }
                                  />

                                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#080D09] bg-[#18C929] text-black">
                                    <CheckCircle2
                                      size={9}
                                      strokeWidth={3}
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black">
                                    {
                                      time.nome
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] font-bold text-[#18C929]/65">
                                    {
                                      origem
                                    }
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                      </div>
                    )}

                    {classificadosDiretos.length >
                      6 && (
                      <div className="mt-3 text-center">
                        <Link
                          href={`/campeonatos/${campeonatoSelecionado.id}#mata-mata`}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-white/35 transition hover:text-[#18C929]"
                        >
                          +{" "}
                          {classificadosDiretos.length -
                            6}{" "}
                          classificados
                          <ChevronRight
                            size={12}
                          />
                        </Link>
                      </div>
                    )}
                  </div>
                </section>

              </div>

              {/* COLUNA DIREITA */}
              <div className="space-y-4">
                {/* ÚLTIMOS RESULTADOS */}
                <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09]">
                  <SectionHeader
                    titulo="Últimos resultados"
                    descricao="Partidas finalizadas"
                    href={`/admin/jogos?campeonato=${campeonatoSelecionado.id}`}
                  />

                  <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
                    {ultimosResultados.length ===
                    0 ? (
                      <EmptyState texto="Nenhum resultado disponível." />
                    ) : (
                      ultimosResultados.map(
                        (jogo) => (
                          <ResultadoCard
                            key={
                              jogo.id
                            }
                            jogo={
                              jogo
                            }
                            casa={
                              obterTime(
                                jogo.time_casa
                              )
                            }
                            visitante={
                              obterTime(
                                jogo.time_visitante
                              )
                            }
                            formatarData={
                              formatarData
                            }
                          />
                        )
                      )
                    )}
                  </div>
                </section>

                {/* ARTILHARIA */}
                <section className="rounded-[24px] border border-[#18C929]/15 bg-[#071208]">
                  <SectionHeader
                    titulo="Artilharia"
                    descricao="Destaque do campeonato"
                    href={`/artilharia?campeonato=${campeonatoSelecionado.id}`}
                  />

                  <div className="px-5 pb-5">
                    {artilheiro ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-[#18C929]/10 bg-[#18C929]/[0.035] p-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#18C929]/10 text-[#18C929]">
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
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Medal
                              size={
                                25
                              }
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black">
                            {
                              artilheiro
                                .jogador
                                .nome
                            }
                          </p>

                          <p className="mt-0.5 truncate text-xs text-white/35">
                            {artilheiro
                              .time
                              ?.nome ??
                              "Time"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black text-[#18C929]">
                            {
                              artilheiro.gols
                            }
                          </p>

                          <p className="text-[9px] font-black uppercase text-white/25">
                            gols
                          </p>
                        </div>
                      </div>
                    ) : (
                      <EmptyState texto="Nenhum gol registrado ainda." />
                    )}
                  </div>
                </section>

                {/* ACESSOS */}
                <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/30">
                    Acesso rápido
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <QuickLink
                      titulo="Times"
                      href={`/admin/times?campeonato=${campeonatoSelecionado.id}`}
                      icon={
                        Shield
                      }
                    />

                    <QuickLink
                      titulo="Jogos"
                      href={`/admin/jogos?campeonato=${campeonatoSelecionado.id}`}
                      icon={
                        CalendarDays
                      }
                    />

                    <QuickLink
                      titulo="Mata-mata"
                      href={`/campeonatos/${campeonatoSelecionado.id}#mata-mata`}
                      icon={
                        Trophy
                      }
                    />

                    <QuickLink
                      titulo="Eventos"
                      href={`/admin/eventos?campeonato=${campeonatoSelecionado.id}`}
                      icon={
                        Goal
                      }
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* BANNER INSTITUCIONAL SECUNDÁRIO */}
            <section className="relative mt-4 overflow-hidden rounded-[20px] border border-[#18C929]/12 bg-[#071208] px-5 py-4 sm:px-6">
              <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#18C929]/10 blur-3xl" />

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#18C929]">
                    FJU Esportes
                  </p>

                  <h3 className="mt-0.5 text-lg font-black">
                    Nascidos para vencer!
                  </h3>
                </div>

                <Link
                  href={`/campeonatos/${campeonatoSelecionado.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#18C929]/20 bg-[#18C929]/10 px-4 py-2 text-[10px] font-black text-[#18C929] transition hover:bg-[#18C929] hover:text-black"
                >
                  Abrir campeonato
                  <ArrowRight
                    size={14}
                  />
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
  href,
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  icon: typeof Trophy;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[18px] border border-white/[0.07] bg-[#080D09] p-4 transition hover:border-[#18C929]/25 hover:bg-[#0A110B]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
          <Icon size={18} />
        </div>

        <ChevronRight
          size={15}
          className="text-white/10 transition group-hover:text-[#18C929]"
        />
      </div>

      <p className="mt-3 text-2xl font-black">
        {valor}
      </p>

      <p className="mt-0.5 text-xs font-black">
        {titulo}
      </p>

      <p className="mt-1 truncate text-[10px] text-white/25">
        {descricao}
      </p>
    </Link>
  );
}

function MiniResumo({
  valor,
  texto,
  destaque = false,
}: {
  valor: number;
  texto: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`min-w-[90px] rounded-xl border px-3 py-2.5 text-center ${
        destaque
          ? "border-[#18C929]/20 bg-[#18C929]/10"
          : "border-white/[0.07] bg-white/[0.025]"
      }`}
    >
      <p
        className={`text-xl font-black ${
          destaque
            ? "text-[#18C929]"
            : "text-white"
        }`}
      >
        {valor}
      </p>

      <p className="text-[9px] font-black uppercase tracking-wide text-white/25">
        {texto}
      </p>
    </div>
  );
}

function SectionHeader({
  titulo,
  descricao,
  href,
}: {
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-black">
          {titulo}
        </h2>

        <p className="mt-0.5 text-[10px] text-white/25">
          {descricao}
        </p>
      </div>

      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-[10px] font-black text-[#18C929]"
      >
        Ver todos
        <ChevronRight
          size={13}
        />
      </Link>
    </div>
  );
}

function ProximoJogo({
  jogo,
  casa,
  visitante,
  formatarData,
  formatarHorario,
}: {
  jogo: Jogo;
  casa: TimeRelacionado | null;
  visitante: TimeRelacionado | null;
  formatarData: (
    data: string | null
  ) => string;
  formatarHorario: (
    horario: string | null
  ) => string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-white/55">
            {formatarData(
              jogo.data_jogo
            )}
          </span>

          {jogo.horario && (
            <>
              <span className="text-white/15">
                •
              </span>

              <span className="text-xs font-bold text-white/35">
                {formatarHorario(
                  jogo.horario
                )}
              </span>
            </>
          )}
        </div>

        {jogo.fase && (
          <span className="rounded-full bg-[#18C929]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#18C929]">
            {FASES.find(
              (item) =>
                item.value ===
                jogo.fase
            )?.curta ??
              jogo.fase}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-white/[0.04] bg-black/10 px-4 py-3.5 sm:px-6">
        <TimeJogo
          time={casa}
        />

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[10px] font-black text-white/35">
          VS
        </div>

        <TimeJogo
          time={visitante}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-white/25">
        <CalendarDays
          size={12}
          className="text-[#18C929]/55"
        />

        <span className="truncate">
          {jogo.local ||
            "Local não informado"}
        </span>
      </div>
    </div>
  );
}

function ResultadoCard({
  jogo,
  casa,
  visitante,
  formatarData,
}: {
  jogo: Jogo;
  casa: TimeRelacionado | null;
  visitante: TimeRelacionado | null;
  formatarData: (
    data: string | null
  ) => string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[9px] text-white/25">
          {formatarData(
            jogo.data_jogo
          )}
        </span>

        {jogo.tipo_resultado ===
          "wo" && (
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase text-amber-300">
            W.O.
          </span>
        )}
      </div>

      <ResultadoLinha
        time={casa}
        gols={
          jogo.gols_casa ?? 0
        }
      />

      <div className="my-1.5 border-t border-white/[0.05]" />

      <ResultadoLinha
        time={visitante}
        gols={
          jogo.gols_visitante ??
          0
        }
      />
    </div>
  );
}

function ResultadoLinha({
  time,
  gols,
}: {
  time: TimeRelacionado | null;
  gols: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Escudo
        time={time}
        pequeno
      />

      <span className="min-w-0 flex-1 truncate text-xs font-bold">
        {time?.nome ||
          "Time"}
      </span>

      <strong className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white/[0.05] px-2 text-sm">
        {gols}
      </strong>
    </div>
  );
}

function TimeJogo({
  time,
}: {
  time: TimeRelacionado | null;
}) {
  return (
    <div className="min-w-0 text-center">
      <Escudo
        time={time}
      />

      <p className="mt-2 truncate text-xs font-black">
        {time?.nome ||
          "Time"}
      </p>
    </div>
  );
}

function Escudo({
  time,
  pequeno = false,
}: {
  time:
    | Time
    | TimeRelacionado
    | null;
  pequeno?: boolean;
}) {
  const tamanho =
    pequeno
      ? "h-7 w-7"
      : "h-10 w-10";

  if (time?.escudo_url) {
    return (
      <div
        className={`${tamanho} mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] p-1`}
      >
        <img
          src={
            time.escudo_url
          }
          alt={
            time.nome
          }
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${tamanho} mx-auto flex shrink-0 items-center justify-center rounded-xl bg-[#18C929]/10 text-[10px] font-black text-[#18C929]`}
    >
      {time?.sigla?.slice(
        0,
        3
      ) || (
        <Shield
          size={15}
        />
      )}
    </div>
  );
}

function QuickLink({
  titulo,
  href,
  icon: Icon,
}: {
  titulo: string;
  href: string;
  icon: typeof Trophy;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs font-black transition hover:border-[#18C929]/20 hover:text-[#18C929]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18C929]/10 text-[#18C929]">
        <Icon
          size={15}
        />
      </div>

      <span className="min-w-0 flex-1 truncate">
        {titulo}
      </span>

      <ChevronRight
        size={13}
        className="text-white/10 transition group-hover:text-[#18C929]"
      />
    </Link>
  );
}

function EmptyState({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-5 text-center">
      <p className="text-xs text-white/30">
        {texto}
      </p>
    </div>
  );
}