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

type FaseMataMata =
  | "preliminar"
  | "dezesseis_avos"
  | "oitavas"
  | "quartas"
  | "semifinal"
  | "final";

const FASES_MATA_MATA: {
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
    curta: "Semifinal",
  },
  {
    value: "final",
    label: "Final",
    curta: "Final",
  },
];

const FASE_ANTERIOR: Partial<
  Record<FaseMataMata, FaseMataMata>
> = {
  dezesseis_avos: "preliminar",
  oitavas: "dezesseis_avos",
  quartas: "oitavas",
  semifinal: "quartas",
  final: "semifinal",
};

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  descricao: string | null;
  logo_url: string | null;
  status: string | null;
  formato: "pontos_corridos" | "mata_mata";
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
  fase: FaseMataMata | null;
  ordem_confronto: number | null;
  grupo_confronto: number | null;
  perna: "ida" | "volta" | null;
  vencedor_id: number | null;
  eliminado_id: number | null;
  tipo_resultado: string | null;
  penaltis_casa: number | null;
  penaltis_visitante: number | null;

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

type LinhaRepescagem = {
  time: Time | null;
  timeId: number;
  saldo: number;
  golsPro: number;
  golsContra: number;
  grupo: number;
  repescado: boolean;
};

type GrupoMataMata = {
  fase: FaseMataMata;
  nome: string;
  grupos: {
    numero: number;
    jogos: Jogo[];
  }[];
};

type TimeClassificado = {
  time: Time;
  origem: string;
  destaque:
    | "participante"
    | "direto"
    | "repescagem";
  provisoria?: boolean;
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

  const [
    faseSelecionada,
    setFaseSelecionada,
  ] =
    useState<FaseMataMata>(
      "preliminar"
    );

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
        status,
        formato
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
        fase,
        ordem_confronto,
        grupo_confronto,
        perna,
        vencedor_id,
        eliminado_id,
        tipo_resultado,
        penaltis_casa,
        penaltis_visitante,

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

  const ehMataMata =
    campeonato?.formato === "mata_mata";

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

  function vencedoresDaFase(
    fase: FaseMataMata
  ) {
    return Array.from(
      new Set(
        jogos
          .filter(
            (jogo) =>
              jogo.fase === fase &&
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
  }

  const fasesMataMata =
    useMemo<GrupoMataMata[]>(() => {
      return FASES_MATA_MATA.map(
        (faseInfo) => {
          const jogosFase =
            jogos.filter(
              (jogo) =>
                jogo.fase ===
                faseInfo.value
            );

          const porGrupo =
            new Map<
              number,
              Jogo[]
            >();

          jogosFase.forEach(
            (jogo) => {
              const numero =
                jogo.grupo_confronto ??
                jogo.ordem_confronto ??
                jogo.id;

              const lista =
                porGrupo.get(
                  numero
                ) ?? [];

              lista.push(jogo);

              porGrupo.set(
                numero,
                lista
              );
            }
          );

          const grupos =
            Array.from(
              porGrupo.entries()
            )
              .map(
                ([
                  numero,
                  partidas,
                ]) => ({
                  numero,
                  jogos: [
                    ...partidas,
                  ].sort(
                    (a, b) => {
                      if (
                        a.perna ===
                          "ida" &&
                        b.perna ===
                          "volta"
                      ) {
                        return -1;
                      }

                      if (
                        a.perna ===
                          "volta" &&
                        b.perna ===
                          "ida"
                      ) {
                        return 1;
                      }

                      return (
                        a.data_jogo ??
                        ""
                      ).localeCompare(
                        b.data_jogo ??
                          ""
                      );
                    }
                  ),
                })
              )
              .sort(
                (a, b) =>
                  a.numero -
                  b.numero
              );

          return {
            fase:
              faseInfo.value,
            nome:
              faseInfo.label,
            grupos,
          };
        }
      );
    }, [jogos]);

  const rankingRepescagem =
    useMemo<LinhaRepescagem[]>(
      () => {
        const preliminar =
          jogos.filter(
            (jogo) =>
              jogo.fase ===
                "preliminar" &&
              jogo.grupo_confronto
          );

        const grupos =
          new Map<
            number,
            Jogo[]
          >();

        preliminar.forEach(
          (jogo) => {
            const numero =
              Number(
                jogo.grupo_confronto
              );

            const lista =
              grupos.get(numero) ??
              [];

            lista.push(jogo);

            grupos.set(
              numero,
              lista
            );
          }
        );

        const linhas:
          LinhaRepescagem[] = [];

        grupos.forEach(
          (
            partidas,
            grupo
          ) => {
            /*
             * W.O. elimina definitivamente.
             * O perdedor não entra na
             * repescagem.
             */
            const jogoWo =
              partidas.find(
                (jogo) =>
                  jogo.status ===
                    "finalizado" &&
                  jogo.tipo_resultado ===
                    "wo" &&
                  jogo.vencedor_id &&
                  jogo.eliminado_id
              );

            if (jogoWo) {
              return;
            }

            const ida =
              partidas.find(
                (jogo) =>
                  jogo.perna ===
                  "ida"
              );

            const volta =
              partidas.find(
                (jogo) =>
                  jogo.perna ===
                  "volta"
              );

            if (
              !ida ||
              !volta ||
              ida.status !==
                "finalizado" ||
              volta.status !==
                "finalizado" ||
              !volta.vencedor_id
            ) {
              return;
            }

            const ids =
              Array.from(
                new Set([
                  ida.time_casa_id,
                  ida.time_visitante_id,
                  volta.time_casa_id,
                  volta.time_visitante_id,
                ])
              );

            if (
              ids.length !== 2
            ) {
              return;
            }

            const numeros =
              new Map<
                number,
                {
                  pro: number;
                  contra: number;
                }
              >();

            ids.forEach(
              (timeId) =>
                numeros.set(
                  timeId,
                  {
                    pro: 0,
                    contra: 0,
                  }
                )
            );

            [ida, volta].forEach(
              (jogo) => {
                const casa =
                  numeros.get(
                    jogo.time_casa_id
                  );

                const visitante =
                  numeros.get(
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

                casa.pro +=
                  golsCasa;

                casa.contra +=
                  golsVisitante;

                visitante.pro +=
                  golsVisitante;

                visitante.contra +=
                  golsCasa;
              }
            );

            const eliminadoId =
              ids.find(
                (timeId) =>
                  timeId !==
                  volta.vencedor_id
              );

            if (!eliminadoId) {
              return;
            }

            const dados =
              numeros.get(
                eliminadoId
              );

            if (!dados) {
              return;
            }

            linhas.push({
              time:
                times.find(
                  (time) =>
                    time.id ===
                    eliminadoId
                ) ?? null,

              timeId:
                eliminadoId,

              saldo:
                dados.pro -
                dados.contra,

              golsPro:
                dados.pro,

              golsContra:
                dados.contra,

              grupo,
              repescado: false,
            });
          }
        );

        linhas.sort(
          (a, b) => {
            if (
              b.saldo !==
              a.saldo
            ) {
              return (
                b.saldo -
                a.saldo
              );
            }

            if (
              b.golsPro !==
              a.golsPro
            ) {
              return (
                b.golsPro -
                a.golsPro
              );
            }

            if (
              a.golsContra !==
              b.golsContra
            ) {
              return (
                a.golsContra -
                b.golsContra
              );
            }

            return (
              a.time?.nome ??
              ""
            ).localeCompare(
              b.time?.nome ??
                ""
            );
          }
        );

        return linhas.map(
          (
            linha,
            index
          ) => ({
            ...linha,
            repescado:
              index < 11,
          })
        );
      },
      [jogos, times]
    );

  const quantidadeConfrontosPreliminar =
    Math.floor(
      times.length / 2
    );

  const confrontosPreliminarDecididos =
    useMemo(() => {
      return new Set(
        jogos
          .filter(
            (jogo) =>
              jogo.fase ===
                "preliminar" &&
              jogo.grupo_confronto &&
              confrontoDecidido(
                jogo
              )
          )
          .map(
            (jogo) =>
              jogo.grupo_confronto
          )
      ).size;
    }, [jogos]);

  const preliminarCompleta =
    quantidadeConfrontosPreliminar >
      0 &&
    confrontosPreliminarDecididos ===
      quantidadeConfrontosPreliminar;

  const faseAtual =
    useMemo(() => {
      return (
        fasesMataMata.find(
          (item) =>
            item.fase ===
            faseSelecionada
        ) ?? {
          fase:
            faseSelecionada,
          nome:
            FASES_MATA_MATA.find(
              (item) =>
                item.value ===
                faseSelecionada
            )?.label ??
            faseSelecionada,
          grupos: [],
        }
      );
    }, [
      fasesMataMata,
      faseSelecionada,
    ]);

  const classificadosFaseSelecionada =
    useMemo<
      TimeClassificado[]
    >(() => {
      if (
        faseSelecionada ===
        "preliminar"
      ) {
        return [...times]
          .sort(
            (a, b) =>
              a.nome.localeCompare(
                b.nome
              )
          )
          .map(
            (time): TimeClassificado => ({
              time,
              origem:
                "Participante da fase preliminar",
              destaque:
                "participante",
            })
          );
      }

      if (
        faseSelecionada ===
        "dezesseis_avos"
      ) {
        const vencedores =
          vencedoresDaFase(
            "preliminar"
          );

        const diretos:
          TimeClassificado[] = [];

        vencedores.forEach(
          (timeId) => {
            const time =
              times.find(
                (item) =>
                  item.id ===
                  timeId
              );

            if (!time) {
              return;
            }

            const jogoDecisivo =
              jogos.find(
                (jogo) =>
                  jogo.fase ===
                    "preliminar" &&
                  confrontoDecidido(
                    jogo
                  ) &&
                  jogo.vencedor_id ===
                    timeId
              );

            diretos.push({
              time,
              origem:
                jogoDecisivo?.tipo_resultado ===
                "wo"
                  ? `Vencedor por W.O. • Confronto ${
                      jogoDecisivo.grupo_confronto ??
                      ""
                    }`
                  : `Vencedor • Confronto ${
                      jogoDecisivo?.grupo_confronto ??
                      ""
                    }`,
              destaque:
                "direto",
            });
          }
        );

        const repescados:
          TimeClassificado[] =
          rankingRepescagem
            .filter(
              (linha) =>
                linha.repescado &&
                linha.time
            )
            .map(
              (
                linha,
                index
              ): TimeClassificado => ({
                time:
                  linha.time as Time,
                origem:
                  preliminarCompleta
                    ? `Repescagem • ${
                        index + 1
                      }º`
                    : `Repescagem provisória • ${
                        index + 1
                      }º`,
                destaque:
                  "repescagem",
                provisoria:
                  !preliminarCompleta,
              })
            );

        return [
          ...diretos,
          ...repescados,
        ].sort(
          (a, b) =>
            a.time.nome.localeCompare(
              b.time.nome
            )
        );
      }

      const anterior =
        FASE_ANTERIOR[
          faseSelecionada
        ];

      if (!anterior) {
        return [];
      }

      const classificados:
        TimeClassificado[] = [];

      vencedoresDaFase(
        anterior
      ).forEach(
        (timeId) => {
          const time =
            times.find(
              (item) =>
                item.id ===
                timeId
            );

          if (!time) {
            return;
          }

          const jogoDecisivo =
            jogos.find(
              (jogo) =>
                jogo.fase ===
                  anterior &&
                confrontoDecidido(
                  jogo
                ) &&
                jogo.vencedor_id ===
                  timeId
            );

          const nomeAnterior =
            FASES_MATA_MATA.find(
              (item) =>
                item.value ===
                anterior
            )?.curta ??
            anterior;

          classificados.push({
            time,
            origem:
              jogoDecisivo?.tipo_resultado ===
              "wo"
                ? `Classificado por W.O. • ${nomeAnterior}`
                : `Vencedor da ${nomeAnterior}`,
            destaque:
              "direto",
          });
        }
      );

      return classificados.sort(
        (a, b) =>
          a.time.nome.localeCompare(
            b.time.nome
          )
      );
    }, [
      faseSelecionada,
      times,
      jogos,
      rankingRepescagem,
      preliminarCompleta,
    ]);

  const confrontosDecididosFaseAtual =
    new Set(
      faseAtual.grupos
        .flatMap(
          (grupo) =>
            grupo.jogos
        )
        .filter(
          confrontoDecidido
        )
        .map(
          (jogo) =>
            jogo.grupo_confronto ??
            jogo.ordem_confronto ??
            jogo.id
        )
    ).size;

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

          {ehMataMata ? (
            <Atalho
              titulo="Mata-mata"
              descricao="Fases e confrontos"
              href={`#mata-mata`}
              icon={Trophy}
            />
          ) : (
            <Atalho
              titulo="Classificação"
              descricao="Tabela completa"
              href={`/classificacao?campeonato=${campeonato.id}`}
              icon={BarChart3}
            />
          )}

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

            {/* CLASSIFICAÇÃO / MATA-MATA */}

            {ehMataMata ? (
              <div
                id="mata-mata"
                className="space-y-5"
              >
                <section className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#080D09]">
                  <div className="border-b border-white/[0.07] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#18C929]">
                          Mata-mata
                        </p>

                        <h2 className="mt-1 text-xl font-black">
                          Acompanhar por fase
                        </h2>

                        <p className="mt-1 text-xs text-white/30">
                          Veja classificados, confrontos, ida, volta, agregado e W.O.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ResumoFase
                          titulo="Times"
                          valor={
                            classificadosFaseSelecionada.length
                          }
                        />

                        <ResumoFase
                          titulo="Confrontos"
                          valor={
                            faseAtual.grupos.length
                          }
                        />

                        <ResumoFase
                          titulo="Decididos"
                          valor={
                            confrontosDecididosFaseAtual
                          }
                          destaque
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                      {FASES_MATA_MATA.map(
                        (item) => {
                          const ativa =
                            faseSelecionada ===
                            item.value;

                          const quantidade =
                            fasesMataMata.find(
                              (faseItem) =>
                                faseItem.fase ===
                                item.value
                            )?.grupos.length ??
                            0;

                          return (
                            <button
                              key={
                                item.value
                              }
                              type="button"
                              onClick={() =>
                                setFaseSelecionada(
                                  item.value
                                )
                              }
                              className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                                ativa
                                  ? "border-[#18C929]/35 bg-[#18C929] text-black"
                                  : "border-white/[0.08] bg-white/[0.025] text-white/45 hover:border-[#18C929]/20 hover:text-white"
                              }`}
                            >
                              {item.curta}

                              {quantidade >
                                0 && (
                                <span
                                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                                    ativa
                                      ? "bg-black/15"
                                      : "bg-white/[0.06]"
                                  }`}
                                >
                                  {
                                    quantidade
                                  }
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#18C929]">
                          {
                            faseAtual.nome
                          }
                        </p>

                        <h3 className="mt-1 text-lg font-black">
                          {faseSelecionada ===
                          "preliminar"
                            ? "Times participantes"
                            : "Classificados para esta fase"}
                        </h3>

                        <p className="mt-1 text-xs text-white/30">
                          {faseSelecionada ===
                          "dezesseis_avos"
                            ? "21 vencedores da preliminar + 11 vagas pela repescagem."
                            : faseSelecionada ===
                                "preliminar"
                              ? "Equipes que disputam a fase preliminar."
                              : "Equipes que já garantiram vaga nesta fase."}
                        </p>
                      </div>

                      <span className="text-sm font-black text-[#18C929]">
                        {
                          classificadosFaseSelecionada.length
                        }{" "}
                        {classificadosFaseSelecionada.length ===
                        1
                          ? "time"
                          : "times"}
                      </span>
                    </div>

                    {classificadosFaseSelecionada.length ===
                    0 ? (
                      <div className="mt-4">
                        <Vazio texto="Ainda não há times classificados para esta fase." />
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {classificadosFaseSelecionada.map(
                          (item) => (
                            <CardClassificado
                              key={
                                item.time.id
                              }
                              item={item}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black">
                        Confrontos
                      </h2>

                      <p className="mt-1 text-xs text-white/30">
                        {faseAtual.nome}
                      </p>
                    </div>

                    <Trophy
                      size={20}
                      className="text-[#18C929]"
                    />
                  </div>

                  {faseAtual.grupos.length ===
                  0 ? (
                    <Vazio
                      texto={
                        classificadosFaseSelecionada.length >
                        0
                          ? "Os classificados já estão definidos, mas os confrontos desta fase ainda não foram cadastrados."
                          : "Nenhum confronto cadastrado nesta fase."
                      }
                    />
                  ) : (
                    <div className="grid gap-4 2xl:grid-cols-2">
                      {faseAtual.grupos.map(
                        (grupo) => (
                          <ConfrontoIdaVolta
                            key={`${faseAtual.fase}-${grupo.numero}`}
                            numero={
                              grupo.numero
                            }
                            jogos={
                              grupo.jogos
                            }
                            obterTime={
                              obterTime
                            }
                            formatarData={
                              formatarData
                            }
                            formatarHorario={
                              formatarHorario
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </section>

                {(faseSelecionada ===
                  "preliminar" ||
                  faseSelecionada ===
                    "dezesseis_avos") && (
                  <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#18C929]">
                          Repescagem
                        </p>

                        <h2 className="mt-1 text-lg font-black">
                          Ranking para os 16 avos
                        </h2>

                        <p className="mt-1 text-xs text-white/30">
                          Saldo agregado, gols marcados e gols sofridos. W.O. elimina definitivamente.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
                        <p className="text-xl font-black text-[#18C929]">
                          {
                            rankingRepescagem.filter(
                              (linha) =>
                                linha.repescado
                            ).length
                          }
                          /11
                        </p>

                        <p className="text-[10px] uppercase text-white/30">
                          vagas
                        </p>
                      </div>
                    </div>

                    {rankingRepescagem.length ===
                    0 ? (
                      <Vazio texto="O ranking aparecerá conforme os confrontos da preliminar forem concluídos." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/[0.07] text-[10px] font-black uppercase tracking-wide text-white/25">
                              <th className="px-3 py-3">
                                #
                              </th>
                              <th className="px-3 py-3">
                                Time
                              </th>
                              <th className="px-3 py-3 text-center">
                                SG
                              </th>
                              <th className="px-3 py-3 text-center">
                                GP
                              </th>
                              <th className="px-3 py-3 text-center">
                                GC
                              </th>
                              <th className="px-3 py-3">
                                Situação
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {rankingRepescagem.map(
                              (
                                linha,
                                index
                              ) => (
                                <tr
                                  key={
                                    linha.timeId
                                  }
                                  className="border-b border-white/[0.05]"
                                >
                                  <td className="px-3 py-3 font-black text-white/35">
                                    {index +
                                      1}
                                  </td>

                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                      <Escudo
                                        time={
                                          linha.time
                                        }
                                      />

                                      <span className="font-bold">
                                        {linha
                                          .time
                                          ?.nome ??
                                          `Time ${linha.timeId}`}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-3 py-3 text-center font-black">
                                    {
                                      linha.saldo
                                    }
                                  </td>

                                  <td className="px-3 py-3 text-center">
                                    {
                                      linha.golsPro
                                    }
                                  </td>

                                  <td className="px-3 py-3 text-center">
                                    {
                                      linha.golsContra
                                    }
                                  </td>

                                  <td className="px-3 py-3">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                                        linha.repescado
                                          ? "bg-[#18C929]/10 text-[#18C929]"
                                          : "bg-red-400/10 text-red-300"
                                      }`}
                                    >
                                      {linha.repescado
                                        ? preliminarCompleta
                                          ? "Repescado"
                                          : "Vaga provisória"
                                        : "Fora da zona"}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!preliminarCompleta && (
                      <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
                        Ranking provisório:{" "}
                        {
                          confrontosPreliminarDecididos
                        }
                        {" de "}
                        {
                          quantidadeConfrontosPreliminar
                        }
                        {" confrontos da preliminar já estão decididos."}
                      </div>
                    )}
                  </section>
                )}
              </div>
            ) : (
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

                {classificacao.length === 0 ? (
                  <Vazio texto="Nenhum time cadastrado." />
                ) : (
                  <div className="space-y-2">
                    {classificacao
                      .slice(0, 5)
                      .map((linha, index) => (
                        <div
                          key={linha.time.id}
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
                            time={linha.time}
                          />

                          <span className="min-w-0 flex-1 truncate text-sm font-bold">
                            {linha.time.nome}
                          </span>

                          <div className="text-right">
                            <p className="font-black text-[#18C929]">
                              {linha.pontos}
                            </p>

                            <p className="text-[10px] uppercase text-white/25">
                              pts
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            )}
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

function ResumoFase({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`min-w-[92px] rounded-xl border px-3 py-2 text-center ${
        destaque
          ? "border-[#18C929]/20 bg-[#18C929]/10"
          : "border-white/[0.07] bg-white/[0.025]"
      }`}
    >
      <p
        className={`text-lg font-black ${
          destaque
            ? "text-[#18C929]"
            : "text-white"
        }`}
      >
        {valor}
      </p>

      <p className="text-[9px] font-black uppercase tracking-wide text-white/30">
        {titulo}
      </p>
    </div>
  );
}

function CardClassificado({
  item,
}: {
  item: TimeClassificado;
}) {
  const estilo =
    item.destaque ===
    "repescagem"
      ? "border-amber-400/15 bg-amber-400/[0.04]"
      : item.destaque ===
          "direto"
        ? "border-[#18C929]/15 bg-[#18C929]/[0.04]"
        : "border-white/[0.06] bg-white/[0.025]";

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${estilo}`}
    >
      <Escudo
        time={item.time}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">
          {item.time.nome}
        </p>

        <p
          className={`mt-0.5 truncate text-[10px] font-bold ${
            item.destaque ===
            "repescagem"
              ? "text-amber-300/70"
              : item.destaque ===
                  "direto"
                ? "text-[#18C929]/70"
                : "text-white/30"
          }`}
        >
          {item.origem}
        </p>
      </div>

      {item.provisoria && (
        <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase text-amber-300">
          provisório
        </span>
      )}
    </div>
  );
}

function ConfrontoIdaVolta({
  numero,
  jogos,
  obterTime,
  formatarData,
  formatarHorario,
}: {
  numero: number;
  jogos: Jogo[];
  obterTime: (
    valor: Time | Time[] | null
  ) => Time | null;
  formatarData: (
    data: string | null
  ) => string;
  formatarHorario: (
    horario: string | null
  ) => string;
}) {
  const ida =
    jogos.find(
      (jogo) =>
        jogo.perna === "ida"
    ) ?? jogos[0];

  const volta =
    jogos.find(
      (jogo) =>
        jogo.perna === "volta"
    ) ?? null;

  const jogoWo =
    jogos.find(
      (jogo) =>
        jogo.status ===
          "finalizado" &&
        jogo.tipo_resultado ===
          "wo" &&
        jogo.vencedor_id
    ) ?? null;

  const idsTimes =
    Array.from(
      new Set(
        jogos.flatMap(
          (jogo) => [
            jogo.time_casa_id,
            jogo.time_visitante_id,
          ]
        )
      )
    );

  const golsPorTime =
    new Map<number, number>();

  idsTimes.forEach(
    (id) =>
      golsPorTime.set(
        id,
        0
      )
  );

  jogos
    .filter(
      (jogo) =>
        jogo.status ===
          "finalizado" &&
        jogo.tipo_resultado !==
          "wo"
    )
    .forEach(
      (jogo) => {
        golsPorTime.set(
          jogo.time_casa_id,
          (golsPorTime.get(
            jogo.time_casa_id
          ) ?? 0) +
            Number(
              jogo.gols_casa ??
                0
            )
        );

        golsPorTime.set(
          jogo.time_visitante_id,
          (golsPorTime.get(
            jogo.time_visitante_id
          ) ?? 0) +
            Number(
              jogo.gols_visitante ??
                0
            )
        );
      }
    );

  const timeAId =
    ida?.time_casa_id ??
    idsTimes[0];

  const timeBId =
    ida?.time_visitante_id ??
    idsTimes[1];

  const timeA =
    timeAId
      ? obterTime(
          jogos.find(
            (jogo) =>
              jogo.time_casa_id ===
              timeAId
          )?.time_casa ??
            jogos.find(
              (jogo) =>
                jogo.time_visitante_id ===
                timeAId
            )?.time_visitante ??
            null
        )
      : null;

  const timeB =
    timeBId
      ? obterTime(
          jogos.find(
            (jogo) =>
              jogo.time_casa_id ===
              timeBId
          )?.time_casa ??
            jogos.find(
              (jogo) =>
                jogo.time_visitante_id ===
                timeBId
            )?.time_visitante ??
            null
        )
      : null;

  const vencedorId =
    jogoWo?.vencedor_id ??
    volta?.vencedor_id ??
    null;

  const eliminadoId =
    jogoWo?.eliminado_id ??
    volta?.eliminado_id ??
    null;

  const finalizado =
    Boolean(
      vencedorId &&
      (
        jogoWo ||
        (
          volta &&
          volta.status ===
            "finalizado"
        )
      )
    );

  function LinhaPartida({
    jogo,
    titulo,
  }: {
    jogo: Jogo | null;
    titulo: string;
  }) {
    if (!jogo) {
      if (jogoWo) {
        return (
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-3 text-center text-xs text-amber-200/60">
            Confronto encerrado por W.O.
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-3 text-center text-xs text-white/25">
          {titulo} ainda não cadastrada
        </div>
      );
    }

    const casa =
      obterTime(
        jogo.time_casa
      );

    const visitante =
      obterTime(
        jogo.time_visitante
      );

    return (
      <div
        className={`rounded-xl border p-3 ${
          jogo.tipo_resultado ===
          "wo"
            ? "border-amber-400/20 bg-amber-400/5"
            : "border-white/[0.05] bg-black/10"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#18C929]">
            {titulo}
          </span>

          <div className="flex items-center gap-2">
            {jogo.tipo_resultado ===
              "wo" && (
              <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-black uppercase text-amber-300">
                W.O.
              </span>
            )}

            <span className="text-[10px] text-white/25">
              {formatarData(
                jogo.data_jogo
              )}
              {jogo.horario
                ? ` • ${formatarHorario(
                    jogo.horario
                  )}`
                : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Escudo
            time={casa}
          />

          <span
            className={`min-w-0 flex-1 truncate text-sm font-bold ${
              jogo.vencedor_id ===
              jogo.time_casa_id
                ? "text-[#18C929]"
                : ""
            }`}
          >
            {casa?.nome ||
              "Time"}
          </span>

          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/[0.05] px-2 font-black">
            {jogo.status ===
            "finalizado"
              ? jogo.gols_casa ??
                0
              : "-"}
          </span>
        </div>

        <div className="my-2 border-t border-white/[0.05]" />

        <div className="flex items-center gap-3">
          <Escudo
            time={visitante}
          />

          <span
            className={`min-w-0 flex-1 truncate text-sm font-bold ${
              jogo.vencedor_id ===
              jogo.time_visitante_id
                ? "text-[#18C929]"
                : ""
            }`}
          >
            {visitante?.nome ||
              "Time"}
          </span>

          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/[0.05] px-2 font-black">
            {jogo.status ===
            "finalizado"
              ? jogo.gols_visitante ??
                0
              : "-"}
          </span>
        </div>

        {jogo.tipo_resultado ===
          "penaltis" && (
          <p className="mt-3 text-center text-[10px] font-black uppercase text-[#18C929]">
            Pênaltis:{" "}
            {jogo.penaltis_casa ??
              0}
            {" × "}
            {jogo.penaltis_visitante ??
              0}
          </p>
        )}

        {jogo.tipo_resultado ===
          "wo" && (
          <p className="mt-3 text-center text-[10px] font-black uppercase text-amber-300">
            Confronto decidido por W.O.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black">
          Confronto {numero}
        </p>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
            jogoWo
              ? "bg-amber-400/10 text-amber-300"
              : finalizado
                ? "bg-[#18C929]/10 text-[#18C929]"
                : "bg-white/[0.05] text-white/30"
          }`}
        >
          {jogoWo
            ? "W.O."
            : finalizado
              ? "Concluído"
              : "Em aberto"}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <LinhaPartida
          jogo={ida}
          titulo="Ida"
        />

        <LinhaPartida
          jogo={volta}
          titulo="Volta"
        />
      </div>

      {jogoWo ? (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
            Decisão do confronto
          </p>

          <p className="mt-2 text-sm font-black text-[#18C929]">
            Classificado:{" "}
            {vencedorId ===
            timeAId
              ? timeA?.nome
              : timeB?.nome}
          </p>

          <p className="mt-1 text-xs font-bold text-red-300">
            Eliminado por W.O.:{" "}
            {eliminadoId ===
            timeAId
              ? timeA?.nome
              : timeB?.nome}
          </p>

          <p className="mt-2 text-[10px] uppercase text-amber-100/50">
            O eliminado não participa da repescagem.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#18C929]/15 bg-[#18C929]/5 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#18C929]">
            Placar agregado
          </p>

          <div
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              vencedorId ===
              timeAId
                ? "bg-[#18C929]/10"
                : "bg-black/10"
            }`}
          >
            <Escudo
              time={timeA}
            />

            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {timeA?.nome ||
                "Time"}
            </span>

            <span
              className={`font-black ${
                vencedorId ===
                timeAId
                  ? "text-[#18C929]"
                  : ""
              }`}
            >
              {golsPorTime.get(
                timeAId
              ) ?? 0}
            </span>
          </div>

          <div className="my-1 text-center text-[10px] text-white/20">
            ×
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              vencedorId ===
              timeBId
                ? "bg-[#18C929]/10"
                : "bg-black/10"
            }`}
          >
            <Escudo
              time={timeB}
            />

            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {timeB?.nome ||
                "Time"}
            </span>

            <span
              className={`font-black ${
                vencedorId ===
                timeBId
                  ? "text-[#18C929]"
                  : ""
              }`}
            >
              {golsPorTime.get(
                timeBId
              ) ?? 0}
            </span>
          </div>

          {finalizado && (
            <p className="mt-3 text-center text-xs font-black text-[#18C929]">
              Classificado:{" "}
              {vencedorId ===
              timeAId
                ? timeA?.nome
                : timeB?.nome}
            </p>
          )}
        </div>
      )}
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