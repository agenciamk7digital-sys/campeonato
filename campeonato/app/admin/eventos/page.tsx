"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

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

    const { data: jogosData, error: jogosError } = await supabase
      .from("jogos")
      .select(`
        id,
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
      .order("horario", { ascending: false });

    if (jogosError) {
      console.error("Erro ao carregar jogos:", jogosError);
      setMensagem(`Erro ao carregar jogos: ${jogosError.message}`);
      setCarregandoDados(false);
      return;
    }

    const { data: jogadoresData, error: jogadoresError } = await supabase
      .from("jogadores")
      .select(`
        id,
        nome,
        numero,
        time_id
      `)
      .order("nome", { ascending: true });

    if (jogadoresError) {
      console.error("Erro ao carregar jogadores:", jogadoresError);
      setMensagem(`Erro ao carregar jogadores: ${jogadoresError.message}`);
      setCarregandoDados(false);
      return;
    }

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

  const jogoSelecionado = useMemo(() => {
    return jogos.find((jogo) => Number(jogo.id) === Number(jogoId)) ?? null;
  }, [jogos, jogoId]);

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
      (jogador) => Number(jogador.time_id) === Number(timeId)
    );
  }, [jogadores, timeId]);

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

    const jogo = jogos.find(
      (item) => Number(item.id) === Number(jogoId)
    );

    if (!jogo) {
      setMensagem("Partida não encontrada.");
      return;
    }

    const timeSelecionadoId = Number(timeId);

    const timeCasaId = Number(jogo.time_casa_id);
    const timeVisitanteId = Number(jogo.time_visitante_id);

    if (
      timeSelecionadoId !== timeCasaId &&
      timeSelecionadoId !== timeVisitanteId
    ) {
      setMensagem("O time selecionado não participa desta partida.");
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
      setMensagem("Este jogador não pertence ao time selecionado.");
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
      setMensagem(`Erro ao cadastrar evento: ${error.message}`);
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

    if (!confirmou) return;

    const { error } = await supabase
      .from("eventos_jogo")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir evento:", error);
      setMensagem(`Erro ao excluir evento: ${error.message}`);
      return;
    }

    setMensagem("Evento excluído com sucesso.");

    if (jogoId) {
      await carregarEventos(Number(jogoId));
    }
  }

  function formatarData(data: string | null) {
    if (!data) return "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(horario: string | null) {
    if (!horario) return "";

    return horario.slice(0, 5);
  }

  function nomeTipo(tipoEvento: string) {
    return (
      TIPOS_EVENTO.find((item) => item.value === tipoEvento)?.label ||
      tipoEvento
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Eventos da partida
          </h1>

          <p className="mt-2 text-white/50">
            Registre gols, assistências e cartões dos jogadores.
          </p>
        </div>

        {carregandoDados ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-10 text-center text-white/40">
            Carregando dados...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
              <h2 className="text-xl font-bold">
                Novo evento
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Partida
                  </label>

                  <select
                    value={jogoId}
                    onChange={(e) => selecionarJogo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="">
                      Selecione a partida
                    </option>

                    {jogos.map((jogo) => (
                      <option
                        key={jogo.id}
                        value={jogo.id}
                      >
                        {jogo.time_casa?.nome || "Time"} x{" "}
                        {jogo.time_visitante?.nome || "Time"} -{" "}
                        {formatarData(jogo.data_jogo)}
                        {jogo.horario
                          ? ` ${formatarHorario(jogo.horario)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Time
                  </label>

                  <select
                    value={timeId}
                    onChange={(e) => selecionarTime(e.target.value)}
                    disabled={!jogoId}
                    className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400 disabled:opacity-40"
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
                    onChange={(e) => setJogadorId(e.target.value)}
                    disabled={!timeId}
                    className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400 disabled:opacity-40"
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
                    className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                    onChange={(e) => setMinuto(e.target.value)}
                    placeholder="Ex: 37"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={cadastrarEvento}
                  disabled={carregando}
                  className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#07111f] transition hover:bg-emerald-300 disabled:opacity-50"
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

            <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
              <h2 className="text-xl font-bold">
                Eventos registrados
              </h2>

              {!jogoId ? (
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
                          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
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
                        onClick={() => excluirEvento(evento.id)}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20"
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