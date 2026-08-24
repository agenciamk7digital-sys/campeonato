"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
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

const TIPOS_EVENTO = [
  { value: "gol", label: "Gol" },
  { value: "assistencia", label: "Assistência" },
  { value: "cartao_amarelo", label: "Cartão amarelo" },
  { value: "cartao_vermelho", label: "Cartão vermelho" },
];

export default function AdminEventosPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const [campeonatoId, setCampeonatoId] = useState("");
  const [jogoId, setJogoId] = useState("");
  const [timeId, setTimeId] = useState("");
  const [jogadorId, setJogadorId] = useState("");
  const [tipo, setTipo] = useState("gol");
  const [minuto, setMinuto] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);

  async function carregarDados() {
    setCarregandoDados(true);
    setMensagem("");

    const [
      { data: campeonatosData, error: campeonatosError },
      { data: jogosData, error: jogosError },
      { data: jogadoresData, error: jogadoresError },
    ] = await Promise.all([
      supabase
        .from("campeonatos")
        .select(`
          id,
          nome,
          temporada,
          ano
        `)
        .order("ano", { ascending: false })
        .order("nome", { ascending: true }),

      supabase
        .from("jogos")
        .select(`
          id,
          campeonato_id,
          data_jogo,
          horario,
          status,
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
        .order("data_jogo", { ascending: false })
        .order("horario", { ascending: false }),

      supabase
        .from("jogadores")
        .select(`
          id,
          nome,
          numero,
          time_id
        `)
        .order("nome", { ascending: true }),
    ]);

    if (campeonatosError) {
      console.error("Erro ao carregar campeonatos:", campeonatosError);
      setMensagem(
        `Erro ao carregar campeonatos: ${campeonatosError.message}`
      );
      setCarregandoDados(false);
      return;
    }

    if (jogosError) {
      console.error("Erro ao carregar jogos:", jogosError);
      setMensagem(`Erro ao carregar jogos: ${jogosError.message}`);
      setCarregandoDados(false);
      return;
    }

    if (jogadoresError) {
      console.error("Erro ao carregar jogadores:", jogadoresError);
      setMensagem(
        `Erro ao carregar jogadores: ${jogadoresError.message}`
      );
      setCarregandoDados(false);
      return;
    }

    setCampeonatos((campeonatosData ?? []) as Campeonato[]);
    setJogos((jogosData ?? []) as unknown as Jogo[]);
    setJogadores((jogadoresData ?? []) as Jogador[]);

    setCarregandoDados(false);
  }

  async function carregarEventos(jogoSelecionadoId: number) {
    const { data, error } = await supabase
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
      .eq("jogo_id", jogoSelecionadoId)
      .order("minuto", { ascending: true });

    if (error) {
      console.error("Erro ao carregar eventos:", error);
      setMensagem(`Erro ao carregar eventos: ${error.message}`);
      return;
    }

    setEventos((data ?? []) as unknown as Evento[]);
  }

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const campeonatoUrl = parametros.get("campeonato");

    if (campeonatoUrl) {
      setCampeonatoId(campeonatoUrl);
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!jogoId) {
      setEventos([]);
      setTimeId("");
      setJogadorId("");
      return;
    }

    carregarEventos(Number(jogoId));
  }, [jogoId]);

  const campeonatoSelecionado = useMemo(() => {
    return (
      campeonatos.find(
        (campeonato) =>
          Number(campeonato.id) === Number(campeonatoId)
      ) ?? null
    );
  }, [campeonatos, campeonatoId]);

  const jogosDoCampeonato = useMemo(() => {
    if (!campeonatoId) {
      return [];
    }

    return jogos.filter(
      (jogo) =>
        Number(jogo.campeonato_id) === Number(campeonatoId)
    );
  }, [jogos, campeonatoId]);

  const jogoSelecionado = useMemo(() => {
    return (
      jogosDoCampeonato.find(
        (jogo) => Number(jogo.id) === Number(jogoId)
      ) ?? null
    );
  }, [jogosDoCampeonato, jogoId]);

  const timesDoJogo = useMemo(() => {
    if (!jogoSelecionado) {
      return [];
    }

    const lista: Time[] = [];

    if (jogoSelecionado.time_casa) {
      lista.push(jogoSelecionado.time_casa);
    }

    if (jogoSelecionado.time_visitante) {
      lista.push(jogoSelecionado.time_visitante);
    }

    return lista;
  }, [jogoSelecionado]);

  const jogadoresDoTime = useMemo(() => {
    if (!timeId) {
      return [];
    }

    return jogadores.filter(
      (jogador) =>
        Number(jogador.time_id) === Number(timeId)
    );
  }, [jogadores, timeId]);

  function selecionarCampeonato(valor: string) {
    setCampeonatoId(valor);

    setJogoId("");
    setTimeId("");
    setJogadorId("");
    setEventos([]);
    setMensagem("");

    const url = new URL(window.location.href);

    if (valor) {
      url.searchParams.set("campeonato", valor);
    } else {
      url.searchParams.delete("campeonato");
    }

    window.history.replaceState({}, "", url.toString());
  }

  function selecionarJogo(valor: string) {
    setJogoId(valor);
    setTimeId("");
    setJogadorId("");
    setMensagem("");
  }

  function selecionarTime(valor: string) {
    setTimeId(valor);
    setJogadorId("");
    setMensagem("");
  }

  async function cadastrarEvento() {
    setMensagem("");

    if (!campeonatoId) {
      setMensagem("Selecione um campeonato.");
      return;
    }

    if (!jogoId) {
      setMensagem("Selecione uma partida.");
      return;
    }

    if (!timeId) {
      setMensagem("Selecione o time.");
      return;
    }

    if (!jogadorId) {
      setMensagem("Selecione o jogador.");
      return;
    }

    if (!tipo) {
      setMensagem("Selecione o tipo do evento.");
      return;
    }

    let minutoNumero: number | null = null;

    if (minuto !== "") {
      minutoNumero = Number(minuto);

      if (
        Number.isNaN(minutoNumero) ||
        minutoNumero < 0 ||
        minutoNumero > 130
      ) {
        setMensagem("Informe um minuto válido.");
        return;
      }
    }

    const jogo = jogosDoCampeonato.find(
      (item) => Number(item.id) === Number(jogoId)
    );

    if (!jogo) {
      setMensagem(
        "A partida selecionada não pertence a este campeonato."
      );
      return;
    }

    const timeSelecionadoId = Number(timeId);
    const timeCasaId = Number(jogo.time_casa_id);
    const timeVisitanteId = Number(jogo.time_visitante_id);

    if (
      timeSelecionadoId !== timeCasaId &&
      timeSelecionadoId !== timeVisitanteId
    ) {
      setMensagem(
        "O time selecionado não participa desta partida."
      );
      return;
    }

    const jogador = jogadores.find(
      (item) => Number(item.id) === Number(jogadorId)
    );

    if (!jogador) {
      setMensagem("Jogador não encontrado.");
      return;
    }

    if (Number(jogador.time_id) !== Number(timeId)) {
      setMensagem(
        "Este jogador não pertence ao time selecionado."
      );
      return;
    }

    setCarregando(true);

    const { error } = await supabase
      .from("eventos_jogo")
      .insert([
        {
          jogo_id: Number(jogoId),
          jogador_id: Number(jogadorId),
          time_id: Number(timeId),
          tipo,
          minuto: minutoNumero,
        },
      ]);

    setCarregando(false);

    if (error) {
      console.error("Erro ao cadastrar evento:", error);
      setMensagem(
        `Erro ao cadastrar evento: ${error.message}`
      );
      return;
    }

    setJogadorId("");
    setMinuto("");
    setMensagem("Evento cadastrado com sucesso.");

    await carregarEventos(Number(jogoId));
  }

  async function excluirEvento(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este evento?"
    );

    if (!confirmou) {
      return;
    }

    const { error } = await supabase
      .from("eventos_jogo")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir evento:", error);
      setMensagem(
        `Erro ao excluir evento: ${error.message}`
      );
      return;
    }

    setMensagem("Evento excluído com sucesso.");

    if (jogoId) {
      await carregarEventos(Number(jogoId));
    }
  }

  function formatarData(data: string | null) {
    if (!data) {
      return "Data não informada";
    }

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(horario: string | null) {
    if (!horario) {
      return "";
    }

    return horario.slice(0, 5);
  }

  function nomeTipo(tipoEvento: string) {
    return (
      TIPOS_EVENTO.find(
        (item) => item.value === tipoEvento
      )?.label || tipoEvento
    );
  }

  function classeEvento(tipoEvento: string) {
    if (tipoEvento === "gol") {
      return "border-[#18C929]/20 bg-[#18C929]/10 text-[#18C929]";
    }

    if (tipoEvento === "assistencia") {
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    }

    if (tipoEvento === "cartao_amarelo") {
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    }

    if (tipoEvento === "cartao_vermelho") {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    return "border-white/10 bg-white/5 text-white/60";
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
              Administração
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Eventos da partida
            </h1>

            <p className="mt-2 text-white/50">
              Registre gols, assistências e cartões dos jogadores.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
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

        {campeonatoSelecionado && (
          <div className="mb-6 rounded-2xl border border-[#18C929]/15 bg-[#18C929]/5 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#18C929]">
              Campeonato selecionado
            </p>

            <p className="mt-1 font-black">
              {campeonatoSelecionado.nome}
              {campeonatoSelecionado.ano
                ? ` • ${campeonatoSelecionado.ano}`
                : campeonatoSelecionado.temporada
                  ? ` • ${campeonatoSelecionado.temporada}`
                  : ""}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {jogosDoCampeonato.length} partida(s) cadastrada(s)
            </p>
          </div>
        )}

        {carregandoDados ? (
          <div className="rounded-3xl border border-white/10 bg-[#0D1F12] p-10 text-center text-white/40">
            Carregando dados...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-6">
              <h2 className="text-xl font-black">
                Novo evento
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Partida
                  </label>

                  <select
                    value={jogoId}
                    onChange={(e) =>
                      selecionarJogo(e.target.value)
                    }
                    disabled={!campeonatoId}
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="">
                      {!campeonatoId
                        ? "Selecione primeiro o campeonato"
                        : "Selecione a partida"}
                    </option>

                    {jogosDoCampeonato.map((jogo) => (
                      <option
                        key={jogo.id}
                        value={jogo.id}
                      >
                        {jogo.time_casa?.nome || "Time"} x{" "}
                        {jogo.time_visitante?.nome || "Time"} -{" "}
                        {formatarData(jogo.data_jogo)}
                        {jogo.horario
                          ? ` • ${formatarHorario(jogo.horario)}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {campeonatoId &&
                    jogosDoCampeonato.length === 0 && (
                      <p className="mt-2 text-xs text-amber-300">
                        Este campeonato ainda não possui partidas.
                      </p>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Time
                  </label>

                  <select
                    value={timeId}
                    onChange={(e) =>
                      selecionarTime(e.target.value)
                    }
                    disabled={!jogoId}
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="">
                      Selecione o time
                    </option>

                    {timesDoJogo.map((time) => (
                      <option
                        key={time.id}
                        value={time.id}
                      >
                        {time.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Jogador
                  </label>

                  <select
                    value={jogadorId}
                    onChange={(e) =>
                      setJogadorId(e.target.value)
                    }
                    disabled={!timeId}
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="">
                      Selecione o jogador
                    </option>

                    {jogadoresDoTime.map((jogador) => (
                      <option
                        key={jogador.id}
                        value={jogador.id}
                      >
                        {jogador.numero
                          ? `#${jogador.numero} - `
                          : ""}
                        {jogador.nome}
                      </option>
                    ))}
                  </select>

                  {timeId && jogadoresDoTime.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      Este time ainda não possui jogadores vinculados.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Tipo
                  </label>

                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929]"
                  >
                    {TIPOS_EVENTO.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Minuto
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={minuto}
                    onChange={(e) =>
                      setMinuto(e.target.value)
                    }
                    placeholder="Ex: 37"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#18C929]"
                  />
                </div>

                <button
                  type="button"
                  onClick={cadastrarEvento}
                  disabled={carregando}
                  className="w-full rounded-xl bg-[#00A500] px-4 py-3 font-bold text-white transition hover:bg-[#14B814] disabled:opacity-50"
                >
                  {carregando
                    ? "Salvando..."
                    : "Cadastrar evento"}
                </button>

                {mensagem && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                    {mensagem}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-black">
                    Eventos registrados
                  </h2>

                  {jogoSelecionado && (
                    <p className="mt-1 text-xs text-white/40">
                      {jogoSelecionado.time_casa?.nome || "Time"} x{" "}
                      {jogoSelecionado.time_visitante?.nome || "Time"}
                    </p>
                  )}
                </div>
              </div>

              {!campeonatoId ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                  Selecione um campeonato.
                </div>
              ) : !jogoId ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                  Selecione uma partida para visualizar os eventos.
                </div>
              ) : eventos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                  Nenhum evento registrado nesta partida.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {eventos.map((evento) => (
                    <div
                      key={evento.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeEvento(
                              evento.tipo
                            )}`}
                          >
                            {nomeTipo(evento.tipo)}
                          </span>

                          {evento.minuto !== null && (
                            <span className="text-sm text-white/40">
                              {evento.minuto}&apos;
                            </span>
                          )}
                        </div>

                        <p className="mt-3 font-bold">
                          {evento.jogador?.numero
                            ? `#${evento.jogador.numero} `
                            : ""}
                          {evento.jogador?.nome || "Jogador"}
                        </p>

                        <p className="mt-1 text-sm text-white/45">
                          {evento.time?.nome || "Time"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          excluirEvento(evento.id)
                        }
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}