"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  MapPin,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type FormatoCampeonato =
  | "pontos_corridos"
  | "mata_mata";

type FaseMataMata =
  | "preliminar"
  | "dezesseis_avos"
  | "oitavas"
  | "quartas"
  | "semifinal"
  | "final";

type Perna = "ida" | "volta";

type Campeonato = {
  id: number;
  nome: string;
  ano: number | null;
  temporada: string | null;
  logo_url: string | null;
  formato: FormatoCampeonato;
};

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
};

type CampeonatoRelacionado = {
  id: number;
  nome: string;
  ano: number | null;
  temporada: string | null;
  logo_url: string | null;
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

  tipo_resultado: string | null;
  vencedor_id: number | null;
  eliminado_id: number | null;

  fase: FaseMataMata | null;
  ordem_confronto: number | null;
  grupo_confronto: number | null;
  perna: Perna | null;

  penaltis_casa: number | null;
  penaltis_visitante: number | null;

  campeonato:
    | CampeonatoRelacionado
    | CampeonatoRelacionado[]
    | null;

  time_casa:
    | TimeRelacionado
    | TimeRelacionado[]
    | null;

  time_visitante:
    | TimeRelacionado
    | TimeRelacionado[]
    | null;
};

type RepescagemLinha = {
  timeId: number;
  time: Time | null;
  saldo: number;
  golsPro: number;
  golsContra: number;
  grupo: number;
  repescado: boolean;
};

const STATUS_OPCOES = [
  {
    value: "agendado",
    label: "Agendado",
  },
  {
    value: "em_andamento",
    label: "Em andamento",
  },
  {
    value: "finalizado",
    label: "Finalizado",
  },
  {
    value: "adiado",
    label: "Adiado",
  },
  {
    value: "cancelado",
    label: "Cancelado",
  },
];

const FASES_MATA_MATA: {
  value: FaseMataMata;
  label: string;
}[] = [
  {
    value: "preliminar",
    label: "Fase preliminar",
  },
  {
    value: "dezesseis_avos",
    label: "16 avos de final",
  },
  {
    value: "oitavas",
    label: "Oitavas de final",
  },
  {
    value: "quartas",
    label: "Quartas de final",
  },
  {
    value: "semifinal",
    label: "Semifinal",
  },
  {
    value: "final",
    label: "Final",
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

function nomeFase(
  fase: FaseMataMata | null
) {
  if (!fase) return "Sem fase";

  return (
    FASES_MATA_MATA.find(
      (item) => item.value === fase
    )?.label ?? fase
  );
}

export default function AdminJogosPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogos, setJogos] =
    useState<Jogo[]>([]);

  const [
    campeonatoId,
    setCampeonatoId,
  ] = useState("");

  const [
    filtroCampeonatoId,
    setFiltroCampeonatoId,
  ] = useState("");

  const [timeCasaId, setTimeCasaId] =
    useState("");

  const [
    timeVisitanteId,
    setTimeVisitanteId,
  ] = useState("");

  const [dataJogo, setDataJogo] =
    useState("");

  const [horario, setHorario] =
    useState("");

  const [local, setLocal] =
    useState("");

  const [status, setStatus] =
    useState("agendado");

  const [fase, setFase] =
    useState<FaseMataMata>("preliminar");

  const [
    grupoConfronto,
    setGrupoConfronto,
  ] = useState("");

  const [perna, setPerna] =
    useState<Perna>("ida");

  const [
    jogoEditandoId,
    setJogoEditandoId,
  ] = useState<number | null>(null);

  const [mensagem, setMensagem] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [
    jogoResultadoId,
    setJogoResultadoId,
  ] = useState<number | null>(null);

  const [golsCasa, setGolsCasa] =
    useState("");

  const [
    golsVisitante,
    setGolsVisitante,
  ] = useState("");

  const [
    penaltisCasa,
    setPenaltisCasa,
  ] = useState("");

  const [
    penaltisVisitante,
    setPenaltisVisitante,
  ] = useState("");

  const [resultadoWo, setResultadoWo] =
    useState(false);

  const [vencedorWoId, setVencedorWoId] =
    useState("");

  async function carregarCampeonatos() {
    const { data, error } =
      await supabase
        .from("campeonatos")
        .select(`
          id,
          nome,
          ano,
          temporada,
          logo_url,
          formato
        `)
        .order("ano", {
          ascending: false,
        })
        .order("nome", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Erro ao carregar campeonatos:",
        error
      );

      setMensagem(
        `Erro ao carregar campeonatos: ${error.message}`
      );

      return;
    }

    setCampeonatos(
      (data ?? []) as Campeonato[]
    );
  }

  async function carregarTimes() {
    const { data, error } =
      await supabase
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
        });

    if (error) {
      console.error(
        "Erro ao carregar times:",
        error
      );

      setMensagem(
        `Erro ao carregar times: ${error.message}`
      );

      return;
    }

    setTimes(data ?? []);
  }

  async function carregarJogos() {
    const { data, error } =
      await supabase
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
          tipo_resultado,
          vencedor_id,
          eliminado_id,
          fase,
          ordem_confronto,
          grupo_confronto,
          perna,
          penaltis_casa,
          penaltis_visitante,

          campeonato:campeonatos (
            id,
            nome,
            ano,
            temporada,
            logo_url
          ),

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
        });

    if (error) {
      console.error(
        "Erro ao carregar jogos:",
        error
      );

      setMensagem(
        `Erro ao carregar jogos: ${error.message}`
      );

      return;
    }

    setJogos(
      (data ?? []) as unknown as Jogo[]
    );
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
    carregarJogos();

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const campeonatoUrl =
      parametros.get("campeonato") || "";

    if (campeonatoUrl) {
      setCampeonatoId(
        campeonatoUrl
      );

      setFiltroCampeonatoId(
        campeonatoUrl
      );
    }
  }, []);

  const campeonatoSelecionado =
    useMemo(() => {
      if (!campeonatoId) {
        return null;
      }

      return (
        campeonatos.find(
          (campeonato) =>
            Number(campeonato.id) ===
            Number(campeonatoId)
        ) ?? null
      );
    }, [
      campeonatos,
      campeonatoId,
    ]);

  const ehMataMata =
    campeonatoSelecionado?.formato ===
    "mata_mata";

  const timesDoCampeonato =
    useMemo(() => {
      if (!campeonatoId) {
        return [];
      }

      return times.filter(
        (time) =>
          Number(
            time.campeonato_id
          ) ===
          Number(campeonatoId)
      );
    }, [
      times,
      campeonatoId,
    ]);

  const jogosDoCampeonato =
    useMemo(() => {
      if (!campeonatoId) {
        return [];
      }

      return jogos.filter(
        (jogo) =>
          Number(
            jogo.campeonato_id
          ) ===
          Number(campeonatoId)
      );
    }, [
      jogos,
      campeonatoId,
    ]);

  const jogosFiltrados =
    useMemo(() => {
      if (!filtroCampeonatoId) {
        return jogos;
      }

      return jogos.filter(
        (jogo) =>
          Number(
            jogo.campeonato_id
          ) ===
          Number(
            filtroCampeonatoId
          )
      );
    }, [
      jogos,
      filtroCampeonatoId,
    ]);

  function obterJogosDaFase(
    faseAlvo: FaseMataMata
  ) {
    return jogosDoCampeonato.filter(
      (jogo) =>
        jogo.fase === faseAlvo
    );
  }

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

  function obterVencedoresDaFase(
    faseAlvo: FaseMataMata
  ) {
    return Array.from(
      new Set(
        obterJogosDaFase(
          faseAlvo
        )
          .filter(
            confrontoDecidido
          )
          .map(
            (jogo) =>
              jogo.vencedor_id
          )
          .filter(
            (
              id
            ): id is number =>
              Boolean(id)
          )
      )
    );
  }

  const rankingRepescagem =
    useMemo<RepescagemLinha[]>(
      () => {
        if (!campeonatoId) {
          return [];
        }

        const preliminar =
          jogos.filter(
            (jogo) =>
              Number(
                jogo.campeonato_id
              ) ===
                Number(
                  campeonatoId
                ) &&
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
            const grupo =
              Number(
                jogo.grupo_confronto
              );

            const lista =
              grupos.get(grupo) ??
              [];

            lista.push(jogo);
            grupos.set(
              grupo,
              lista
            );
          }
        );

        const linhas:
          RepescagemLinha[] = [];

        grupos.forEach(
          (
            partidas,
            grupo
          ) => {
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

            /*
             * W.O. elimina o time definitivamente.
             * Portanto ele NÃO participa da repescagem.
             */
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

            const idsTimes =
              Array.from(
                new Set(
                  [
                    ida.time_casa_id,
                    ida.time_visitante_id,
                    volta.time_casa_id,
                    volta.time_visitante_id,
                  ].filter(
                    (
                      valor
                    ): valor is number =>
                      Boolean(valor)
                  )
                )
              );

            if (
              idsTimes.length !== 2
            ) {
              return;
            }

            const golsPorTime =
              new Map<
                number,
                {
                  pro: number;
                  contra: number;
                }
              >();

            idsTimes.forEach(
              (idTime) =>
                golsPorTime.set(
                  idTime,
                  {
                    pro: 0,
                    contra: 0,
                  }
                )
            );

            [ida, volta].forEach(
              (partida) => {
                if (
                  !partida.time_casa_id ||
                  !partida.time_visitante_id
                ) {
                  return;
                }

                const golsCasa =
                  Number(
                    partida.gols_casa ??
                      0
                  );

                const golsVisitante =
                  Number(
                    partida.gols_visitante ??
                      0
                  );

                const casa =
                  golsPorTime.get(
                    partida.time_casa_id
                  );

                const visitante =
                  golsPorTime.get(
                    partida.time_visitante_id
                  );

                if (
                  casa &&
                  visitante
                ) {
                  casa.pro +=
                    golsCasa;

                  casa.contra +=
                    golsVisitante;

                  visitante.pro +=
                    golsVisitante;

                  visitante.contra +=
                    golsCasa;
                }
              }
            );

            const eliminadoId =
              idsTimes.find(
                (idTime) =>
                  idTime !==
                  volta.vencedor_id
              );

            if (!eliminadoId) {
              return;
            }

            const numeros =
              golsPorTime.get(
                eliminadoId
              );

            if (!numeros) {
              return;
            }

            linhas.push({
              timeId:
                eliminadoId,

              time:
                times.find(
                  (time) =>
                    Number(
                      time.id
                    ) ===
                    Number(
                      eliminadoId
                    )
                ) ?? null,

              saldo:
                numeros.pro -
                numeros.contra,

              golsPro:
                numeros.pro,

              golsContra:
                numeros.contra,

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
          (linha, index) => ({
            ...linha,
            repescado:
              index < 11,
          })
        );
      },
      [
        jogos,
        times,
        campeonatoId,
      ]
    );

  const vencedoresPreliminar =
    useMemo(() => {
      if (!campeonatoId) {
        return [];
      }

      return Array.from(
        new Set(
          jogos
            .filter(
              (jogo) =>
                Number(
                  jogo.campeonato_id
                ) ===
                  Number(
                    campeonatoId
                  ) &&
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
    }, [
      jogos,
      campeonatoId,
    ]);

  const classificados16Avos =
    useMemo(() => {
      return Array.from(
        new Set([
          ...vencedoresPreliminar,
          ...rankingRepescagem
            .filter(
              (linha) =>
                linha.repescado
            )
            .map(
              (linha) =>
                linha.timeId
            ),
        ])
      );
    }, [
      vencedoresPreliminar,
      rankingRepescagem,
    ]);

  const preliminarCompleta =
    useMemo(() => {
      if (!campeonatoId) {
        return false;
      }

      const quantidadeEsperada =
        Math.floor(
          timesDoCampeonato.length /
            2
        );

      if (
        quantidadeEsperada === 0
      ) {
        return false;
      }

      const gruposDecididos =
        new Set(
          jogosDoCampeonato
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
        );

      return (
        gruposDecididos.size ===
        quantidadeEsperada
      );
    }, [
      campeonatoId,
      timesDoCampeonato,
      jogosDoCampeonato,
    ]);

  function faseAnteriorCompleta(
    faseAlvo: FaseMataMata
  ) {
    if (
      faseAlvo ===
      "preliminar"
    ) {
      return true;
    }

    if (
      faseAlvo ===
      "dezesseis_avos"
    ) {
      return preliminarCompleta;
    }

    const anterior =
      FASE_ANTERIOR[
        faseAlvo
      ];

    if (!anterior) {
      return true;
    }

    const jogosFaseAnterior =
      obterJogosDaFase(
        anterior
      );

    const grupos =
      new Set(
        jogosFaseAnterior
          .filter(
            (jogo) =>
              jogo.grupo_confronto
          )
          .map(
            (jogo) =>
              jogo.grupo_confronto
          )
      );

    if (
      grupos.size === 0
    ) {
      return false;
    }

    const gruposComVencedor =
      new Set(
        jogosFaseAnterior
          .filter(
            (jogo) =>
              confrontoDecidido(
                jogo
              )
          )
          .map(
            (jogo) =>
              jogo.grupo_confronto
          )
      );

    return (
      grupos.size ===
      gruposComVencedor.size
    );
  }

  const idsTimesElegiveis =
    useMemo(() => {
      if (!ehMataMata) {
        return timesDoCampeonato.map(
          (time) => time.id
        );
      }

      if (
        fase === "preliminar"
      ) {
        return timesDoCampeonato.map(
          (time) => time.id
        );
      }

      if (
        fase ===
        "dezesseis_avos"
      ) {
        return preliminarCompleta
          ? classificados16Avos
          : [];
      }

      const anterior =
        FASE_ANTERIOR[fase];

      if (
        !anterior ||
        !faseAnteriorCompleta(
          fase
        )
      ) {
        return [];
      }

      return obterVencedoresDaFase(
        anterior
      );
    }, [
      ehMataMata,
      fase,
      timesDoCampeonato,
      preliminarCompleta,
      classificados16Avos,
      jogosDoCampeonato,
    ]);

  const timesElegiveis =
    useMemo(() => {
      const ids =
        new Set(
          idsTimesElegiveis
        );

      if (
        jogoEditandoId !== null
      ) {
        if (timeCasaId) {
          ids.add(
            Number(timeCasaId)
          );
        }

        if (
          timeVisitanteId
        ) {
          ids.add(
            Number(
              timeVisitanteId
            )
          );
        }
      }

      return timesDoCampeonato.filter(
        (time) =>
          ids.has(time.id)
      );
    }, [
      idsTimesElegiveis,
      timesDoCampeonato,
      jogoEditandoId,
      timeCasaId,
      timeVisitanteId,
    ]);

  function selecionarCampeonato(
    valor: string
  ) {
    setCampeonatoId(valor);
    setFiltroCampeonatoId(
      valor
    );

    limparFormularioPartida();
    setMensagem("");
  }

  function obterCampeonato(
    jogo: Jogo
  ): CampeonatoRelacionado | null {
    if (!jogo.campeonato) {
      return null;
    }

    if (
      Array.isArray(
        jogo.campeonato
      )
    ) {
      return (
        jogo.campeonato[0] ??
        null
      );
    }

    return jogo.campeonato;
  }

  function obterTimeCasa(
    jogo: Jogo
  ): TimeRelacionado | null {
    if (!jogo.time_casa) {
      return null;
    }

    if (
      Array.isArray(
        jogo.time_casa
      )
    ) {
      return (
        jogo.time_casa[0] ??
        null
      );
    }

    return jogo.time_casa;
  }

  function obterTimeVisitante(
    jogo: Jogo
  ): TimeRelacionado | null {
    if (
      !jogo.time_visitante
    ) {
      return null;
    }

    if (
      Array.isArray(
        jogo.time_visitante
      )
    ) {
      return (
        jogo.time_visitante[0] ??
        null
      );
    }

    return jogo.time_visitante;
  }

  function limparFormularioPartida() {
    setTimeCasaId("");
    setTimeVisitanteId("");
    setDataJogo("");
    setHorario("");
    setLocal("");
    setStatus("agendado");
    setFase("preliminar");
    setGrupoConfronto("");
    setPerna("ida");
    setJogoEditandoId(null);
  }

  function editarJogo(
    jogo: Jogo
  ) {
    setJogoEditandoId(
      jogo.id
    );

    setCampeonatoId(
      String(
        jogo.campeonato_id ??
          ""
      )
    );

    setFiltroCampeonatoId(
      String(
        jogo.campeonato_id ??
          ""
      )
    );

    setTimeCasaId(
      String(
        jogo.time_casa_id ??
          ""
      )
    );

    setTimeVisitanteId(
      String(
        jogo.time_visitante_id ??
          ""
      )
    );

    setDataJogo(
      jogo.data_jogo ?? ""
    );

    setHorario(
      jogo.horario
        ? jogo.horario.slice(
            0,
            5
          )
        : ""
    );

    setLocal(
      jogo.local ?? ""
    );

    setStatus(
      jogo.status ??
        "agendado"
    );

    setFase(
      jogo.fase ??
        "preliminar"
    );

    setGrupoConfronto(
      jogo.grupo_confronto
        ? String(
            jogo.grupo_confronto
          )
        : ""
    );

    setPerna(
      jogo.perna ?? "ida"
    );

    setMensagem(
      "Editando partida."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    limparFormularioPartida();
    setMensagem("");
  }

  async function salvarPartida() {
    setMensagem("");

    if (!campeonatoId) {
      setMensagem(
        "Selecione o campeonato."
      );
      return;
    }

    if (!timeCasaId) {
      setMensagem(
        "Selecione o time da casa."
      );
      return;
    }

    if (!timeVisitanteId) {
      setMensagem(
        "Selecione o time visitante."
      );
      return;
    }

    if (
      timeCasaId ===
      timeVisitanteId
    ) {
      setMensagem(
        "O time da casa e o visitante não podem ser o mesmo."
      );
      return;
    }

    if (!dataJogo) {
      setMensagem(
        "Informe a data do jogo."
      );
      return;
    }

    const timeCasa =
      times.find(
        (time) =>
          Number(time.id) ===
          Number(timeCasaId)
      );

    const timeVisitante =
      times.find(
        (time) =>
          Number(time.id) ===
          Number(
            timeVisitanteId
          )
      );

    if (
      !timeCasa ||
      !timeVisitante
    ) {
      setMensagem(
        "Um dos times selecionados não foi encontrado."
      );
      return;
    }

    if (
      Number(
        timeCasa.campeonato_id
      ) !==
        Number(
          campeonatoId
        ) ||
      Number(
        timeVisitante
          .campeonato_id
      ) !==
        Number(
          campeonatoId
        )
    ) {
      setMensagem(
        "Os dois times precisam pertencer ao campeonato selecionado."
      );
      return;
    }

    let grupoNumero:
      number | null = null;

    if (ehMataMata) {
      grupoNumero =
        Number(
          grupoConfronto
        );

      if (
        !grupoConfronto ||
        Number.isNaN(
          grupoNumero
        ) ||
        grupoNumero < 1 ||
        !Number.isInteger(
          grupoNumero
        )
      ) {
        setMensagem(
          "Informe um número válido para o confronto."
        );
        return;
      }

      if (
        !faseAnteriorCompleta(
          fase
        )
      ) {
        setMensagem(
          "A fase anterior ainda não foi concluída."
        );
        return;
      }

      const idsElegiveis =
        new Set(
          idsTimesElegiveis
        );

      if (
        jogoEditandoId ===
          null &&
        (
          !idsElegiveis.has(
            Number(timeCasaId)
          ) ||
          !idsElegiveis.has(
            Number(
              timeVisitanteId
            )
          )
        )
      ) {
        setMensagem(
          "Um dos times selecionados ainda não está classificado para esta fase."
        );
        return;
      }

      const jogosMesmaFase =
        jogosDoCampeonato.filter(
          (jogo) =>
            jogo.fase === fase &&
            jogo.id !==
              jogoEditandoId
        );

      const mesmaPerna =
        jogosMesmaFase.find(
          (jogo) =>
            Number(
              jogo.grupo_confronto
            ) ===
              grupoNumero &&
            jogo.perna === perna
        );

      if (mesmaPerna) {
        setMensagem(
          `O confronto ${grupoNumero} já possui jogo de ${perna}.`
        );
        return;
      }

      const outroJogoGrupo =
        jogosMesmaFase.find(
          (jogo) =>
            Number(
              jogo.grupo_confronto
            ) ===
            grupoNumero
        );

      if (outroJogoGrupo) {
        const idsExistentes =
          new Set([
            Number(
              outroJogoGrupo.time_casa_id
            ),
            Number(
              outroJogoGrupo.time_visitante_id
            ),
          ]);

        if (
          !idsExistentes.has(
            Number(timeCasaId)
          ) ||
          !idsExistentes.has(
            Number(
              timeVisitanteId
            )
          )
        ) {
          setMensagem(
            "Os jogos de ida e volta do mesmo confronto precisam ter os mesmos dois times."
          );
          return;
        }
      }

      const timeEmOutroConfronto =
        jogosMesmaFase.find(
          (jogo) =>
            Number(
              jogo.grupo_confronto
            ) !==
              grupoNumero &&
            (
              Number(
                jogo.time_casa_id
              ) ===
                Number(
                  timeCasaId
                ) ||
              Number(
                jogo.time_visitante_id
              ) ===
                Number(
                  timeCasaId
                ) ||
              Number(
                jogo.time_casa_id
              ) ===
                Number(
                  timeVisitanteId
                ) ||
              Number(
                jogo.time_visitante_id
              ) ===
                Number(
                  timeVisitanteId
                )
            )
        );

      if (
        timeEmOutroConfronto
      ) {
        setMensagem(
          "Um dos times já está vinculado a outro confronto nesta fase."
        );
        return;
      }

      if (
        perna === "volta" &&
        !outroJogoGrupo
      ) {
        setMensagem(
          "Cadastre primeiro o jogo de ida deste confronto."
        );
        return;
      }
    }

    setCarregando(true);

    const dados = {
      campeonato_id:
        Number(
          campeonatoId
        ),

      time_casa_id:
        Number(
          timeCasaId
        ),

      time_visitante_id:
        Number(
          timeVisitanteId
        ),

      data_jogo:
        dataJogo,

      horario:
        horario || null,

      local:
        local.trim() ||
        null,

      status,

      fase:
        ehMataMata
          ? fase
          : null,

      grupo_confronto:
        ehMataMata
          ? grupoNumero
          : null,

      ordem_confronto:
        ehMataMata
          ? grupoNumero
          : null,

      perna:
        ehMataMata
          ? perna
          : null,
    };

    let error:
      { message: string } |
      null = null;

    if (
      jogoEditandoId !==
      null
    ) {
      const resposta =
        await supabase
          .from("jogos")
          .update(dados)
          .eq(
            "id",
            jogoEditandoId
          );

      error =
        resposta.error;
    } else {
      const resposta =
        await supabase
          .from("jogos")
          .insert([
            {
              ...dados,
              gols_casa: 0,
              gols_visitante: 0,
            },
          ]);

      error =
        resposta.error;
    }

    setCarregando(false);

    if (error) {
      console.error(
        "Erro ao salvar jogo:",
        error
      );

      setMensagem(
        `Erro ao salvar jogo: ${error.message}`
      );
      return;
    }

    setMensagem(
      jogoEditandoId !== null
        ? "Partida atualizada com sucesso."
        : "Partida cadastrada com sucesso."
    );

    setFiltroCampeonatoId(
      campeonatoId
    );

    limparFormularioPartida();

    await carregarJogos();
  }

  function abrirResultado(
    jogo: Jogo
  ) {
    setJogoResultadoId(
      jogo.id
    );

    setGolsCasa(
      String(
        jogo.gols_casa ??
          0
      )
    );

    setGolsVisitante(
      String(
        jogo.gols_visitante ??
          0
      )
    );

    setPenaltisCasa(
      jogo.penaltis_casa !==
        null
        ? String(
            jogo.penaltis_casa
          )
        : ""
    );

    setPenaltisVisitante(
      jogo.penaltis_visitante !==
        null
        ? String(
            jogo.penaltis_visitante
          )
        : ""
    );

    setResultadoWo(
      jogo.tipo_resultado ===
        "wo"
    );

    setVencedorWoId(
      jogo.tipo_resultado ===
          "wo" &&
        jogo.vencedor_id
        ? String(
            jogo.vencedor_id
          )
        : ""
    );

    setMensagem("");
  }

  function cancelarResultado() {
    setJogoResultadoId(null);
    setGolsCasa("");
    setGolsVisitante("");
    setPenaltisCasa("");
    setPenaltisVisitante("");
    setResultadoWo(false);
    setVencedorWoId("");
  }

  function somarPlacarPartida(
    mapa: Map<
      number,
      number
    >,
    timeCasa:
      number | null,
    timeVisitante:
      number | null,
    golsCasaNumero:
      number,
    golsVisitanteNumero:
      number
  ) {
    if (
      !timeCasa ||
      !timeVisitante
    ) {
      return;
    }

    mapa.set(
      timeCasa,
      (mapa.get(
        timeCasa
      ) ?? 0) +
        golsCasaNumero
    );

    mapa.set(
      timeVisitante,
      (mapa.get(
        timeVisitante
      ) ?? 0) +
        golsVisitanteNumero
    );
  }

  async function salvarResultado(
    jogo: Jogo
  ) {
    setMensagem("");

    if (
      golsCasa === "" ||
      golsVisitante === ""
    ) {
      setMensagem(
        "Informe o placar completo."
      );
      return;
    }

    const golsCasaNumero =
      Number(golsCasa);

    const golsVisitanteNumero =
      Number(
        golsVisitante
      );

    if (
      Number.isNaN(
        golsCasaNumero
      ) ||
      Number.isNaN(
        golsVisitanteNumero
      ) ||
      golsCasaNumero < 0 ||
      golsVisitanteNumero <
        0 ||
      !Number.isInteger(
        golsCasaNumero
      ) ||
      !Number.isInteger(
        golsVisitanteNumero
      )
    ) {
      setMensagem(
        "Informe um placar válido."
      );
      return;
    }

    const campeonatoDoJogo =
      campeonatos.find(
        (campeonato) =>
          Number(
            campeonato.id
          ) ===
          Number(
            jogo.campeonato_id
          )
      );

    const jogoMataMata =
      campeonatoDoJogo?.formato ===
      "mata_mata";

    let vencedorId:
      number | null = null;

    let eliminadoId:
      number | null = null;

    let tipoResultado:
      string | null = null;

    let penaltisCasaNumero:
      number | null = null;

    let penaltisVisitanteNumero:
      number | null = null;

    if (jogoMataMata) {
      if (
        !jogo.fase ||
        !jogo.grupo_confronto ||
        !jogo.perna
      ) {
        setMensagem(
          "Antes de lançar o resultado, edite esta partida e informe fase, confronto e ida/volta."
        );
        return;
      }

      /*
       * =====================================
       * RESULTADO POR W.O.
       * =====================================
       *
       * O time perdedor é eliminado
       * definitivamente e não participa
       * da repescagem.
       */
      if (resultadoWo) {
        if (
          !vencedorWoId
        ) {
          setMensagem(
            "Selecione qual time venceu por W.O."
          );
          return;
        }

        const vencedorWoNumero =
          Number(
            vencedorWoId
          );

        if (
          vencedorWoNumero !==
            Number(
              jogo.time_casa_id
            ) &&
          vencedorWoNumero !==
            Number(
              jogo.time_visitante_id
            )
        ) {
          setMensagem(
            "Selecione um vencedor válido para o W.O."
          );
          return;
        }

        vencedorId =
          vencedorWoNumero;

        eliminadoId =
          vencedorWoNumero ===
          Number(
            jogo.time_casa_id
          )
            ? jogo.time_visitante_id
            : jogo.time_casa_id;

        tipoResultado =
          "wo";
      } else if (
        jogo.perna ===
        "volta"
      ) {
        const ida =
          jogos.find(
            (partida) =>
              partida.id !==
                jogo.id &&
              Number(
                partida.campeonato_id
              ) ===
                Number(
                  jogo.campeonato_id
                ) &&
              partida.fase ===
                jogo.fase &&
              Number(
                partida.grupo_confronto
              ) ===
                Number(
                  jogo.grupo_confronto
                ) &&
              partida.perna ===
                "ida"
          );

        if (!ida) {
          setMensagem(
            "O jogo de ida deste confronto não foi encontrado."
          );
          return;
        }

        if (
          ida.status !==
          "finalizado"
        ) {
          setMensagem(
            "Lance primeiro o resultado do jogo de ida."
          );
          return;
        }

        /*
         * Se o confronto já foi decidido por
         * W.O. na ida, não deve haver nova
         * definição por agregado.
         */
        if (
          ida.tipo_resultado ===
            "wo" &&
          ida.vencedor_id
        ) {
          setMensagem(
            "Este confronto já foi encerrado por W.O. no jogo de ida."
          );
          return;
        }

        const agregado =
          new Map<
            number,
            number
          >();

        somarPlacarPartida(
          agregado,
          ida.time_casa_id,
          ida.time_visitante_id,
          Number(
            ida.gols_casa ??
              0
          ),
          Number(
            ida.gols_visitante ??
              0
          )
        );

        somarPlacarPartida(
          agregado,
          jogo.time_casa_id,
          jogo.time_visitante_id,
          golsCasaNumero,
          golsVisitanteNumero
        );

        if (
          !jogo.time_casa_id ||
          !jogo.time_visitante_id
        ) {
          setMensagem(
            "Os times deste confronto não estão definidos."
          );
          return;
        }

        const agregadoCasa =
          agregado.get(
            jogo.time_casa_id
          ) ?? 0;

        const agregadoVisitante =
          agregado.get(
            jogo.time_visitante_id
          ) ?? 0;

        if (
          agregadoCasa >
          agregadoVisitante
        ) {
          vencedorId =
            jogo.time_casa_id;

          eliminadoId =
            jogo.time_visitante_id;

          tipoResultado =
            "agregado";
        } else if (
          agregadoVisitante >
          agregadoCasa
        ) {
          vencedorId =
            jogo.time_visitante_id;

          eliminadoId =
            jogo.time_casa_id;

          tipoResultado =
            "agregado";
        } else {
          if (
            penaltisCasa ===
              "" ||
            penaltisVisitante ===
              ""
          ) {
            setMensagem(
              "O placar agregado terminou empatado. Informe o resultado dos pênaltis."
            );
            return;
          }

          penaltisCasaNumero =
            Number(
              penaltisCasa
            );

          penaltisVisitanteNumero =
            Number(
              penaltisVisitante
            );

          if (
            Number.isNaN(
              penaltisCasaNumero
            ) ||
            Number.isNaN(
              penaltisVisitanteNumero
            ) ||
            penaltisCasaNumero <
              0 ||
            penaltisVisitanteNumero <
              0 ||
            !Number.isInteger(
              penaltisCasaNumero
            ) ||
            !Number.isInteger(
              penaltisVisitanteNumero
            ) ||
            penaltisCasaNumero ===
              penaltisVisitanteNumero
          ) {
            setMensagem(
              "Informe um placar de pênaltis válido e com vencedor."
            );
            return;
          }

          if (
            penaltisCasaNumero >
            penaltisVisitanteNumero
          ) {
            vencedorId =
              jogo.time_casa_id;

            eliminadoId =
              jogo.time_visitante_id;
          } else {
            vencedorId =
              jogo.time_visitante_id;

            eliminadoId =
              jogo.time_casa_id;
          }

          tipoResultado =
            "penaltis";
        }
      }
    }

    setCarregando(true);

    const { error } =
      await supabase
        .from("jogos")
        .update({
          gols_casa:
            golsCasaNumero,

          gols_visitante:
            golsVisitanteNumero,

          status:
            "finalizado",

          vencedor_id:
            jogoMataMata &&
            (
              resultadoWo ||
              jogo.perna ===
                "volta"
            )
              ? vencedorId
              : null,

          eliminado_id:
            jogoMataMata &&
            (
              resultadoWo ||
              jogo.perna ===
                "volta"
            )
              ? eliminadoId
              : null,

          tipo_resultado:
            jogoMataMata &&
            (
              resultadoWo ||
              jogo.perna ===
                "volta"
            )
              ? tipoResultado
              : null,

          penaltis_casa:
            jogoMataMata &&
            !resultadoWo &&
            jogo.perna ===
              "volta"
              ? penaltisCasaNumero
              : null,

          penaltis_visitante:
            jogoMataMata &&
            !resultadoWo &&
            jogo.perna ===
              "volta"
              ? penaltisVisitanteNumero
              : null,
        })
        .eq(
          "id",
          jogo.id
        );

    if (error) {
      setCarregando(false);

      console.error(
        "Erro ao salvar resultado:",
        error
      );

      setMensagem(
        `Erro ao salvar resultado: ${error.message}`
      );
      return;
    }

    /*
     * Se houve W.O., qualquer outra partida
     * ainda não concluída do mesmo confronto
     * é cancelada automaticamente.
     */
    if (
      jogoMataMata &&
      resultadoWo &&
      jogo.fase &&
      jogo.grupo_confronto
    ) {
      const { error:
        erroCancelarOutroJogo } =
        await supabase
          .from("jogos")
          .update({
            status:
              "cancelado",
            vencedor_id:
              vencedorId,
            eliminado_id:
              eliminadoId,
            tipo_resultado:
              "wo",
          })
          .eq(
            "campeonato_id",
            jogo.campeonato_id
          )
          .eq(
            "fase",
            jogo.fase
          )
          .eq(
            "grupo_confronto",
            jogo.grupo_confronto
          )
          .neq(
            "id",
            jogo.id
          )
          .neq(
            "status",
            "finalizado"
          );

      if (
        erroCancelarOutroJogo
      ) {
        console.error(
          "Resultado salvo, mas houve erro ao cancelar a outra partida do confronto:",
          erroCancelarOutroJogo
        );
      }
    }

    setCarregando(false);

    if (
      jogoMataMata &&
      resultadoWo
    ) {
      setMensagem(
        "Resultado salvo como W.O. O time perdedor foi eliminado definitivamente e não entra na repescagem."
      );
    } else if (
      jogoMataMata &&
      jogo.perna ===
        "volta"
    ) {
      setMensagem(
        tipoResultado ===
          "penaltis"
          ? "Resultado salvo. Classificado definido nos pênaltis."
          : "Resultado salvo. Classificado definido pelo placar agregado."
      );
    } else {
      setMensagem(
        "Resultado salvo com sucesso."
      );
    }

    cancelarResultado();

    await carregarJogos();
  }

  async function excluirJogo(
    id: number
  ) {
    const confirmou =
      window.confirm(
        "Tem certeza que deseja excluir esta partida?"
      );

    if (!confirmou) {
      return;
    }

    const { error } =
      await supabase
        .from("jogos")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Erro ao excluir jogo:",
        error
      );

      setMensagem(
        `Erro ao excluir jogo: ${error.message}`
      );
      return;
    }

    setMensagem(
      "Partida excluída com sucesso."
    );

    await carregarJogos();
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return "Data não informada";
    }

    const [
      ano,
      mes,
      dia,
    ] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(
    valor: string | null
  ) {
    if (!valor) {
      return "";
    }

    return valor.slice(
      0,
      5
    );
  }

  function nomeStatus(
    valor: string | null
  ) {
    return (
      STATUS_OPCOES.find(
        (item) =>
          item.value === valor
      )?.label ||
      valor ||
      "Agendado"
    );
  }

  function nomeCampeonato(
    jogo: Jogo
  ) {
    const campeonato =
      obterCampeonato(jogo);

    if (!campeonato) {
      return "Sem campeonato";
    }

    const temporada =
      campeonato.ano ??
      campeonato.temporada;

    return temporada
      ? `${campeonato.nome} • ${temporada}`
      : campeonato.nome;
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Jogos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Cadastre partidas por campeonato,
            organize ida e volta e lance os resultados.
          </p>

          {campeonatoSelecionado && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#18C929]/20 bg-[#18C929]/10 px-3 py-1.5 text-xs font-bold text-[#18C929]">
                Campeonato:
                <span className="text-white">
                  {campeonatoSelecionado.nome}
                </span>
              </div>

              {ehMataMata && (
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60">
                  Mata-mata • ida e volta
                </div>
              )}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/[0.08] bg-[#0D1F12] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                  {jogoEditandoId !== null ? (
                    <Pencil size={20} />
                  ) : (
                    <CalendarDays size={21} />
                  )}
                </div>

                <h2 className="text-xl font-black">
                  {jogoEditandoId !== null
                    ? "Editar partida"
                    : "Nova partida"}
                </h2>
              </div>

              {jogoEditandoId !== null && (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Campeonato
                </label>

                <select
                  value={campeonatoId}
                  onChange={(e) =>
                    selecionarCampeonato(
                      e.target.value
                    )
                  }
                  disabled={
                    jogoEditandoId !== null
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929] disabled:opacity-50"
                >
                  <option value="">
                    Selecione o campeonato
                  </option>

                  {campeonatos.map(
                    (campeonato) => (
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
                    )
                  )}
                </select>
              </div>

              {ehMataMata && (
                <>
                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      Fase
                    </label>

                    <select
                      value={fase}
                      onChange={(e) => {
                        setFase(
                          e.target
                            .value as FaseMataMata
                        );
                        setGrupoConfronto("");
                        setTimeCasaId("");
                        setTimeVisitanteId("");
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929]"
                    >
                      {FASES_MATA_MATA.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </select>

                    {fase !== "preliminar" &&
                      !faseAnteriorCompleta(
                        fase
                      ) && (
                        <p className="mt-2 text-xs text-amber-300">
                          A fase anterior ainda não foi concluída.
                        </p>
                      )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-white/60">
                        Nº do confronto
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          grupoConfronto
                        }
                        onChange={(e) =>
                          setGrupoConfronto(
                            e.target.value
                          )
                        }
                        placeholder="Ex: 1"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#18C929]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/60">
                        Partida
                      </label>

                      <select
                        value={perna}
                        onChange={(e) =>
                          setPerna(
                            e.target
                              .value as Perna
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929]"
                      >
                        <option value="ida">
                          Ida
                        </option>
                        <option value="volta">
                          Volta
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#18C929]/15 bg-[#18C929]/5 p-3 text-xs leading-5 text-white/50">
                    Use o mesmo número de confronto
                    para os jogos de ida e volta.
                    Na volta, o site calcula o placar
                    agregado e, se houver empate,
                    usa os pênaltis.
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time da casa
                </label>

                <select
                  value={timeCasaId}
                  onChange={(e) =>
                    setTimeCasaId(
                      e.target.value
                    )
                  }
                  disabled={
                    !campeonatoId ||
                    (
                      ehMataMata &&
                      timesElegiveis.length ===
                        0
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {(ehMataMata
                    ? timesElegiveis
                    : timesDoCampeonato
                  ).map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                      disabled={
                        Number(time.id) ===
                        Number(
                          timeVisitanteId
                        )
                      }
                    >
                      {time.nome}
                      {time.sigla
                        ? ` (${time.sigla})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-2xl font-black text-[#18C929]">
                X
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time visitante
                </label>

                <select
                  value={
                    timeVisitanteId
                  }
                  onChange={(e) =>
                    setTimeVisitanteId(
                      e.target.value
                    )
                  }
                  disabled={
                    !campeonatoId ||
                    (
                      ehMataMata &&
                      timesElegiveis.length ===
                        0
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {(ehMataMata
                    ? timesElegiveis
                    : timesDoCampeonato
                  ).map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                      disabled={
                        Number(time.id) ===
                        Number(
                          timeCasaId
                        )
                      }
                    >
                      {time.nome}
                      {time.sigla
                        ? ` (${time.sigla})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Data
                  </label>

                  <input
                    type="date"
                    value={dataJogo}
                    onChange={(e) =>
                      setDataJogo(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#18C929]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Horário
                  </label>

                  <input
                    type="time"
                    value={horario}
                    onChange={(e) =>
                      setHorario(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#18C929]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Local
                </label>

                <input
                  type="text"
                  value={local}
                  onChange={(e) =>
                    setLocal(
                      e.target.value
                    )
                  }
                  placeholder="Ex: Arena Municipal"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#18C929]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#18C929]"
                >
                  {STATUS_OPCOES.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={
                  salvarPartida
                }
                disabled={
                  carregando ||
                  !campeonatoId ||
                  timesDoCampeonato.length <
                    2
                }
                className="w-full rounded-xl bg-[#18C929] px-4 py-3 font-black text-black transition hover:bg-[#2DDF3B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando
                  ? "Salvando..."
                  : jogoEditandoId !==
                      null
                    ? "Salvar alterações"
                    : "Cadastrar partida"}
              </button>

              {mensagem && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  {mensagem}
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            {ehMataMata && (
              <section className="rounded-3xl border border-white/[0.08] bg-[#0D1F12] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#18C929]">
                      Repescagem
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Ranking dos eliminados
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      Saldo agregado, gols marcados e
                      gols sofridos. Os 11 melhores
                      avançam aos 16 avos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-[#18C929]">
                      {
                        classificados16Avos.length
                      }
                    </p>

                    <p className="text-[10px] font-bold uppercase text-white/35">
                      classificados / 32
                    </p>
                  </div>
                </div>

                {rankingRepescagem.length ===
                0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
                    O ranking aparecerá conforme os
                    confrontos da fase preliminar
                    forem concluídos.
                  </div>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase text-white/30">
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
                              <td className="px-3 py-3 font-black text-white/40">
                                {index + 1}
                              </td>

                              <td className="px-3 py-3 font-bold">
                                {linha.time
                                  ?.nome ??
                                  `Time ${linha.timeId}`}
                              </td>

                              <td className="px-3 py-3 text-center font-black">
                                {linha.saldo}
                              </td>

                              <td className="px-3 py-3 text-center">
                                {linha.golsPro}
                              </td>

                              <td className="px-3 py-3 text-center">
                                {linha.golsContra}
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
                                    ? "Repescado"
                                    : "Eliminado"}
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
                    O ranking é provisório até os 21
                    confrontos da preliminar terem
                    ida e volta finalizadas.
                  </div>
                )}
              </section>
            )}

            <section className="rounded-3xl border border-white/[0.08] bg-[#0D1F12] p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                    <Trophy size={21} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black">
                      Partidas cadastradas
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      {jogosFiltrados.length} partida(s)
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-72">
                  <label className="mb-2 block text-xs text-white/40">
                    Filtrar campeonato
                  </label>

                  <select
                    value={
                      filtroCampeonatoId
                    }
                    onChange={(e) =>
                      setFiltroCampeonatoId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#18C929]"
                  >
                    <option value="">
                      Todos os campeonatos
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
                          {campeonato.nome}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {jogosFiltrados.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                  Nenhuma partida encontrada.
                </div>
              ) : (
                <div className="space-y-4">
                  {jogosFiltrados.map(
                    (jogo) => {
                      const timeCasa =
                        obterTimeCasa(
                          jogo
                        );

                      const timeVisitante =
                        obterTimeVisitante(
                          jogo
                        );

                      return (
                        <article
                          key={jogo.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#18C929]">
                                {nomeCampeonato(
                                  jogo
                                )}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                                  {nomeStatus(
                                    jogo.status
                                  )}
                                </span>

                                {jogo.fase && (
                                  <span className="inline-flex rounded-full bg-[#18C929]/10 px-3 py-1 text-xs font-bold text-[#18C929]">
                                    {nomeFase(
                                      jogo.fase
                                    )}
                                  </span>
                                )}

                                {jogo.grupo_confronto && (
                                  <span className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                                    Confronto{" "}
                                    {
                                      jogo.grupo_confronto
                                    }
                                  </span>
                                )}

                                {jogo.perna && (
                                  <span className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-white/50">
                                    {jogo.perna}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-xs text-white/40">
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

                          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-5">
                            <TimePartida
                              time={timeCasa}
                            />

                            <div className="text-center">
                              {jogo.status ===
                              "finalizado" ? (
                                <>
                                  <div className="whitespace-nowrap text-2xl font-black sm:text-3xl">
                                    {jogo.gols_casa ??
                                      0}

                                    <span className="mx-2 text-white/30">
                                      ×
                                    </span>

                                    {jogo.gols_visitante ??
                                      0}
                                  </div>

                                  {jogo.tipo_resultado ===
                                    "penaltis" && (
                                    <p className="mt-2 text-[10px] font-black uppercase text-[#18C929]">
                                      Pênaltis{" "}
                                      {jogo.penaltis_casa ??
                                        0}
                                      {" × "}
                                      {jogo.penaltis_visitante ??
                                        0}
                                    </p>
                                  )}

                                  {jogo.tipo_resultado ===
                                    "wo" && (
                                    <p className="mt-2 text-[10px] font-black uppercase text-amber-300">
                                      Resultado por W.O.
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-2xl font-black text-[#18C929] sm:text-3xl">
                                  X
                                </span>
                              )}
                            </div>

                            <TimePartida
                              time={
                                timeVisitante
                              }
                            />
                          </div>

                          {jogo.local && (
                            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-white/40">
                              <MapPin
                                size={14}
                              />

                              {jogo.local}
                            </p>
                          )}

                          {jogoResultadoId ===
                          jogo.id ? (
                            <div className="mt-5 rounded-2xl border border-[#18C929]/20 bg-[#18C929]/5 p-4">
                              <p className="mb-4 text-sm font-bold text-[#18C929]">
                                Lançar resultado
                              </p>

                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={
                                    golsCasa
                                  }
                                  onChange={(e) =>
                                    setGolsCasa(
                                      e.target
                                        .value
                                    )
                                  }
                                  className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xl font-black outline-none focus:border-[#18C929]"
                                />

                                <span className="font-black text-white/30">
                                  ×
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={
                                    golsVisitante
                                  }
                                  onChange={(e) =>
                                    setGolsVisitante(
                                      e.target
                                        .value
                                    )
                                  }
                                  className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xl font-black outline-none focus:border-[#18C929]"
                                />
                              </div>

                              {ehMataMata && (
                                <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="font-black text-amber-200">
                                        Resultado por W.O.
                                      </p>

                                      <p className="mt-1 text-xs leading-5 text-amber-100/60">
                                        O perdedor é eliminado definitivamente e não participa da repescagem.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResultadoWo(
                                          (valor) =>
                                            !valor
                                        );

                                        setVencedorWoId("");
                                        setPenaltisCasa("");
                                        setPenaltisVisitante("");
                                      }}
                                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                        resultadoWo
                                          ? "bg-amber-400"
                                          : "bg-white/10"
                                      }`}
                                    >
                                      <span
                                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                                          resultadoWo
                                            ? "left-6"
                                            : "left-1"
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  {resultadoWo && (
                                    <div className="mt-4">
                                      <label className="mb-2 block text-xs font-bold text-amber-100/70">
                                        Vencedor por W.O.
                                      </label>

                                      <select
                                        value={
                                          vencedorWoId
                                        }
                                        onChange={(e) =>
                                          setVencedorWoId(
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-amber-400/20 bg-[#17351D] px-4 py-3 outline-none focus:border-amber-400"
                                      >
                                        <option value="">
                                          Selecione o vencedor
                                        </option>

                                        {jogo.time_casa_id && (
                                          <option
                                            value={
                                              jogo.time_casa_id
                                            }
                                          >
                                            {timeCasa?.nome ||
                                              "Time da casa"}
                                          </option>
                                        )}

                                        {jogo.time_visitante_id && (
                                          <option
                                            value={
                                              jogo.time_visitante_id
                                            }
                                          >
                                            {timeVisitante?.nome ||
                                              "Time visitante"}
                                          </option>
                                        )}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}

                              {jogo.perna ===
                                "volta" &&
                                !resultadoWo && (
                                <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="mb-3 text-xs font-bold text-white/50">
                                    Pênaltis — preencha somente
                                    se o agregado terminar
                                    empatado
                                  </p>

                                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={
                                        penaltisCasa
                                      }
                                      onChange={(e) =>
                                        setPenaltisCasa(
                                          e.target
                                            .value
                                        )
                                      }
                                      placeholder="0"
                                      className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center font-black outline-none focus:border-[#18C929]"
                                    />

                                    <span className="font-black text-white/30">
                                      ×
                                    </span>

                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={
                                        penaltisVisitante
                                      }
                                      onChange={(e) =>
                                        setPenaltisVisitante(
                                          e.target
                                            .value
                                        )
                                      }
                                      placeholder="0"
                                      className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center font-black outline-none focus:border-[#18C929]"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <button
                                  type="button"
                                  onClick={() =>
                                    salvarResultado(
                                      jogo
                                    )
                                  }
                                  disabled={
                                    carregando
                                  }
                                  className="flex-1 rounded-xl bg-[#18C929] px-4 py-3 font-black text-black transition hover:bg-[#2DDF3B] disabled:opacity-50"
                                >
                                  Salvar resultado
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelarResultado
                                  }
                                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 hover:bg-white/5"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirResultado(
                                    jogo
                                  )
                                }
                                className="rounded-xl bg-[#18C929]/10 px-4 py-3 text-sm font-bold text-[#18C929] transition hover:bg-[#18C929]/20"
                              >
                                {jogo.status ===
                                "finalizado"
                                  ? "Editar resultado"
                                  : "Lançar resultado"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  editarJogo(
                                    jogo
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10"
                              >
                                <Pencil
                                  size={15}
                                />
                                Editar partida
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  excluirJogo(
                                    jogo.id
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-400/20"
                              >
                                <Trash2
                                  size={15}
                                />
                                Excluir
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    }
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

function TimePartida({
  time,
}: {
  time:
    | TimeRelacionado
    | null;
}) {
  return (
    <div className="min-w-0 text-center">
      {time?.escudo_url ? (
        <img
          src={time.escudo_url}
          alt={time.nome}
          className="mx-auto h-14 w-14 object-contain sm:h-16 sm:w-16"
        />
      ) : (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18C929]/10 text-sm font-black text-[#18C929] sm:h-16 sm:w-16">
          {time?.sigla?.slice(
            0,
            3
          ) || (
            <Shield
              size={20}
            />
          )}
        </div>
      )}

      <p className="mt-3 truncate text-sm font-bold sm:text-base">
        {time?.nome ||
          "Time"}
      </p>
    </div>
  );
}
