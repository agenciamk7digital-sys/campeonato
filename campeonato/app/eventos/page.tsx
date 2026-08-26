"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Goal,
  Search,
  Shield,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
};

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  time_id: number | string | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;
  data_jogo: string | null;
  horario: string | null;
  status: string | null;
  gols_casa: number | null;
  gols_visitante: number | null;
  tipo_resultado: string | null;
  time_casa_id: number | string;
  time_visitante_id: number | string;
  time_casa: Time | null;
  time_visitante: Time | null;
};

type Evento = {
  id: number;
  jogo_id: number;
  jogador_id: number | null;
  time_id: number | null;
  tipo: string;
  minuto: number | null;

  jogador: {
    id: number;
    nome: string;
    numero: number | null;
  } | null;

  time: {
    id: number;
    nome: string;
  } | null;
};

const TIPOS_EVENTO: Record<
  string,
  string
> = {
  gol: "Gol",
  assistencia: "Assistência",
  cartao_amarelo:
    "Cartão amarelo",
  cartao_vermelho:
    "Cartão vermelho",
};

export default function EventosPublicPage() {
  const [
    campeonatos,
    setCampeonatos,
  ] = useState<Campeonato[]>([]);

  const [jogos, setJogos] =
    useState<Jogo[]>([]);

  const [
    eventos,
    setEventos,
  ] = useState<Evento[]>([]);

  const [
    campeonatoId,
    setCampeonatoId,
  ] = useState("");

  const [jogoId, setJogoId] =
    useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("todos");

  const [
    buscaPartida,
    setBuscaPartida,
  ] = useState("");

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    carregandoEventos,
    setCarregandoEventos,
  ] = useState(false);

  const [mensagem, setMensagem] =
    useState("");

  async function carregarDados() {
    setCarregandoDados(true);
    setMensagem("");

    const [
      campeonatosResponse,
      jogosResponse,
    ] = await Promise.all([
      supabase
        .from("campeonatos")
        .select(`
          id,
          nome,
          temporada,
          ano
        `)
        .order("ano", {
          ascending: false,
        })
        .order("nome", {
          ascending: true,
        }),

      supabase
        .from("jogos")
        .select(`
          id,
          campeonato_id,
          data_jogo,
          horario,
          status,
          gols_casa,
          gols_visitante,
          tipo_resultado,
          time_casa_id,
          time_visitante_id,

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
          ascending: false,
        })
        .order("horario", {
          ascending: false,
        }),
    ]);

    if (
      campeonatosResponse.error
    ) {
      setMensagem(
        `Erro ao carregar campeonatos: ${campeonatosResponse.error.message}`
      );
      setCarregandoDados(false);
      return;
    }

    if (jogosResponse.error) {
      setMensagem(
        `Erro ao carregar jogos: ${jogosResponse.error.message}`
      );
      setCarregandoDados(false);
      return;
    }

    setCampeonatos(
      (campeonatosResponse.data ??
        []) as Campeonato[]
    );

    setJogos(
      (jogosResponse.data ??
        []) as unknown as Jogo[]
    );

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const campeonatoUrl =
      parametros.get(
        "campeonato"
      ) || "";

    const jogoUrl =
      parametros.get("jogo") ||
      "";

    if (campeonatoUrl) {
      setCampeonatoId(
        campeonatoUrl
      );
    }

    if (jogoUrl) {
      setJogoId(jogoUrl);
    }

    setCarregandoDados(false);
  }

  async function carregarEventos(
    jogoSelecionadoId: number
  ) {
    setCarregandoEventos(true);
    setMensagem("");

    const { data, error } =
      await supabase
        .from("eventos_jogo")
        .select(`
          id,
          jogo_id,
          jogador_id,
          time_id,
          tipo,
          minuto,

          jogador:jogadores (
            id,
            nome,
            numero
          ),

          time:times (
            id,
            nome
          )
        `)
        .eq(
          "jogo_id",
          jogoSelecionadoId
        )
        .order("minuto", {
          ascending: true,
        });

    if (error) {
      setMensagem(
        `Erro ao carregar eventos: ${error.message}`
      );
      setEventos([]);
      setCarregandoEventos(false);
      return;
    }

    setEventos(
      (data ?? []) as unknown as Evento[]
    );

    setCarregandoEventos(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!jogoId) {
      setEventos([]);
      return;
    }

    carregarEventos(
      Number(jogoId)
    );
  }, [jogoId]);

  const campeonatoSelecionado =
    useMemo(() => {
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
          Number(
            campeonatoId
          )
      );
    }, [
      jogos,
      campeonatoId,
    ]);

  const jogosFiltrados =
    useMemo(() => {
      const termo =
        buscaPartida
          .trim()
          .toLowerCase();

      return jogosDoCampeonato.filter(
        (jogo) => {
          const statusOk =
            filtroStatus ===
              "todos" ||
            jogo.status ===
              filtroStatus;

          const buscaOk =
            !termo ||
            (jogo.time_casa?.nome ??
              "")
              .toLowerCase()
              .includes(termo) ||
            (jogo.time_visitante
              ?.nome ??
              "")
              .toLowerCase()
              .includes(termo);

          return (
            statusOk &&
            buscaOk
          );
        }
      );
    }, [
      jogosDoCampeonato,
      filtroStatus,
      buscaPartida,
    ]);

  const jogoSelecionado =
    useMemo(() => {
      return (
        jogosDoCampeonato.find(
          (jogo) =>
            Number(jogo.id) ===
            Number(jogoId)
        ) ?? null
      );
    }, [
      jogosDoCampeonato,
      jogoId,
    ]);

  function selecionarCampeonato(
    valor: string
  ) {
    setCampeonatoId(valor);
    setJogoId("");
    setEventos([]);

    const url = new URL(
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

    url.searchParams.delete(
      "jogo"
    );

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  function selecionarJogo(
    valor: string
  ) {
    setJogoId(valor);

    const url = new URL(
      window.location.href
    );

    if (valor) {
      url.searchParams.set(
        "jogo",
        valor
      );
    } else {
      url.searchParams.delete(
        "jogo"
      );
    }

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
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
    horario: string | null
  ) {
    return horario
      ? horario.slice(0, 5)
      : "";
  }

  function nomeTipo(
    tipo: string
  ) {
    return (
      TIPOS_EVENTO[tipo] ??
      tipo.replaceAll("_", " ")
    );
  }

  function iconEvento(
    tipo: string
  ) {
    if (tipo === "gol") {
      return (
        <Goal
          size={18}
        />
      );
    }

    return (
      <UserRound
        size={18}
      />
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px]">

        {/* CABEÇALHO */}

        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#18C929]">
            FJU Esportes
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Eventos
          </h1>

          <p className="mt-1 text-sm text-white/35">
            Consulte gols, assistências e cartões registrados nas partidas.
          </p>
        </header>

        {/* FILTROS */}

        <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[240px_1fr]">

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-white/30">
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
                className="w-full rounded-xl border border-white/[0.08] bg-[#102713] px-4 py-3 text-sm outline-none focus:border-[#18C929]/40"
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

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-white/30">
                Encontrar partida
              </label>

              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  value={
                    buscaPartida
                  }
                  onChange={(e) =>
                    setBuscaPartida(
                      e.target.value
                    )
                  }
                  disabled={
                    !campeonatoId
                  }
                  placeholder="Buscar pelo nome de um time..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#18C929]/40 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {campeonatoId && (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  {
                    value:
                      "todos",
                    label:
                      "Todos",
                  },
                  {
                    value:
                      "agendado",
                    label:
                      "Agendados",
                  },
                  {
                    value:
                      "finalizado",
                    label:
                      "Finalizados",
                  },
                ].map(
                  (item) => (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setFiltroStatus(
                          item.value
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black transition ${
                        filtroStatus ===
                        item.value
                          ? "border-[#18C929]/25 bg-[#18C929]/10 text-[#18C929]"
                          : "border-white/[0.07] bg-white/[0.025] text-white/35 hover:text-white/60"
                      }`}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-white/30">
                  Partida
                </label>

                <select
                  value={jogoId}
                  onChange={(e) =>
                    selecionarJogo(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-[#102713] px-4 py-3 text-sm outline-none focus:border-[#18C929]/40"
                >
                  <option value="">
                    {jogosFiltrados.length >
                    0
                      ? `Selecione a partida • ${jogosFiltrados.length} encontrada(s)`
                      : "Nenhuma partida encontrada"}
                  </option>

                  {jogosFiltrados.map(
                    (jogo) => (
                      <option
                        key={
                          jogo.id
                        }
                        value={
                          jogo.id
                        }
                      >
                        {jogo
                          .time_casa
                          ?.nome ??
                          "Time"}{" "}
                        x{" "}
                        {jogo
                          .time_visitante
                          ?.nome ??
                          "Time"}
                        {" • "}
                        {formatarData(
                          jogo.data_jogo
                        )}
                        {jogo.horario
                          ? ` • ${formatarHorario(
                              jogo.horario
                            )}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>
            </>
          )}
        </section>

        {mensagem && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {mensagem}
          </div>
        )}

        {carregandoDados ? (
          <div className="mt-4 text-sm text-white/35">
            Carregando dados...
          </div>
        ) : !campeonatoId ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Selecione um campeonato para visualizar as partidas.
          </div>
        ) : jogosDoCampeonato.length ===
          0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Este campeonato ainda não possui partidas.
          </div>
        ) : !jogoSelecionado ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
            Selecione uma partida para visualizar os eventos.
          </div>
        ) : (
          <>
            {/* PARTIDA SELECIONADA */}

            <section className="mt-4 rounded-[24px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#18C929]">
                    Partida selecionada
                  </p>

                  <div className="mt-3 grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="min-w-0 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] p-1.5">
                        {jogoSelecionado
                          .time_casa
                          ?.escudo_url ? (
                          <img
                            src={
                              jogoSelecionado
                                .time_casa
                                .escudo_url
                            }
                            alt={
                              jogoSelecionado
                                .time_casa
                                .nome
                            }
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Shield
                            size={18}
                            className="text-[#18C929]"
                          />
                        )}
                      </div>

                      <p className="mt-2 truncate text-sm font-black">
                        {jogoSelecionado
                          .time_casa
                          ?.nome ??
                          "Time"}
                      </p>
                    </div>

                    <div className="text-center">
                      {jogoSelecionado.status ===
                      "finalizado" ? (
                        <>
                          <div className="rounded-2xl border border-[#18C929]/15 bg-[#18C929]/[0.04] px-4 py-2">
                            <span className="text-2xl font-black">
                              {jogoSelecionado.gols_casa ??
                                0}
                            </span>

                            <span className="mx-2 text-white/20">
                              ×
                            </span>

                            <span className="text-2xl font-black">
                              {jogoSelecionado.gols_visitante ??
                                0}
                            </span>
                          </div>

                          <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-[#18C929]">
                            {jogoSelecionado.tipo_resultado ===
                            "wo"
                              ? "Finalizado • W.O."
                              : "Finalizado"}
                          </p>
                        </>
                      ) : (
                        <div className="rounded-xl bg-white/[0.04] px-4 py-2 text-xs font-black text-white/35">
                          VS
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] p-1.5">
                        {jogoSelecionado
                          .time_visitante
                          ?.escudo_url ? (
                          <img
                            src={
                              jogoSelecionado
                                .time_visitante
                                .escudo_url
                            }
                            alt={
                              jogoSelecionado
                                .time_visitante
                                .nome
                            }
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Shield
                            size={18}
                            className="text-[#18C929]"
                          />
                        )}
                      </div>

                      <p className="mt-2 truncate text-sm font-black">
                        {jogoSelecionado
                          .time_visitante
                          ?.nome ??
                          "Time"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-white/30">
                    {formatarData(
                      jogoSelecionado.data_jogo
                    )}
                    {jogoSelecionado.horario
                      ? ` • ${formatarHorario(
                          jogoSelecionado.horario
                        )}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-white/40">
                  <CalendarDays
                    size={15}
                    className="text-[#18C929]"
                  />

                  {eventos.length} evento
                  {eventos.length === 1
                    ? ""
                    : "s"}
                </div>
              </div>
            </section>

            {/* LISTA */}

            <section className="mt-4">
              {carregandoEventos ? (
                <div className="text-sm text-white/35">
                  Carregando eventos...
                </div>
              ) : eventos.length ===
                0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/30">
                  Nenhum evento registrado nesta partida.
                </div>
              ) : (
                <div className="space-y-2">
                  {eventos.map(
                    (evento) => (
                      <article
                        key={
                          evento.id
                        }
                        className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#080D09] p-4 sm:flex-row sm:items-center"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            evento.tipo ===
                            "gol"
                              ? "bg-[#18C929]/10 text-[#18C929]"
                              : evento.tipo ===
                                  "cartao_vermelho"
                                ? "bg-red-500/10 text-red-300"
                                : evento.tipo ===
                                    "cartao_amarelo"
                                  ? "bg-amber-400/10 text-amber-300"
                                  : "bg-white/[0.05] text-white/50"
                          }`}
                        >
                          {iconEvento(
                            evento.tipo
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black">
                              {nomeTipo(
                                evento.tipo
                              )}
                            </p>

                            {evento.minuto !==
                              null && (
                              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-black text-white/40">
                                {evento.minuto}
                                &apos;
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-white/45">
                            {evento
                              .jogador
                              ?.numero
                              ? `#${evento.jogador.numero} `
                              : ""}
                            {evento
                              .jogador
                              ?.nome ??
                              "Jogador não informado"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Shield
                            size={14}
                            className="text-[#18C929]/65"
                          />

                          {evento.time
                            ?.nome ??
                            "Time não informado"}
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
