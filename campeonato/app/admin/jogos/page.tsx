"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  ano: number | null;
  temporada: string | null;
  logo_url: string | null;
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
  time_casa_id: number;
  time_visitante_id: number;
  gols_casa: number | null;
  gols_visitante: number | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;

  campeonato: CampeonatoRelacionado | null;
  time_casa: TimeRelacionado | null;
  time_visitante: TimeRelacionado | null;
};

const STATUS_OPCOES = [
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "adiado", label: "Adiado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function AdminJogosPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);

  const [campeonatoId, setCampeonatoId] = useState("");
  const [filtroCampeonatoId, setFiltroCampeonatoId] = useState("");

  const [timeCasaId, setTimeCasaId] = useState("");
  const [timeVisitanteId, setTimeVisitanteId] = useState("");

  const [dataJogo, setDataJogo] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [status, setStatus] = useState("agendado");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [jogoResultadoId, setJogoResultadoId] =
    useState<number | null>(null);

  const [golsCasa, setGolsCasa] = useState("");
  const [golsVisitante, setGolsVisitante] = useState("");

  async function carregarCampeonatos() {
    const { data, error } = await supabase
      .from("campeonatos")
      .select(`
        id,
        nome,
        ano,
        temporada,
        logo_url
      `)
      .order("ano", { ascending: false })
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar campeonatos:", error);
      setMensagem(
        `Erro ao carregar campeonatos: ${error.message}`
      );
      return;
    }

    setCampeonatos(data ?? []);
  }

  async function carregarTimes() {
    const { data, error } = await supabase
      .from("times")
      .select(`
        id,
        nome,
        sigla,
        escudo_url,
        campeonato_id
      `)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar times:", error);
      setMensagem(`Erro ao carregar times: ${error.message}`);
      return;
    }

    setTimes(data ?? []);
  }

  async function carregarJogos() {
    const { data, error } = await supabase
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
      .order("data_jogo", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao carregar jogos:", error);
      setMensagem(`Erro ao carregar jogos: ${error.message}`);
      return;
    }

    setJogos((data ?? []) as unknown as Jogo[]);
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
    carregarJogos();
  }, []);

  const timesDoCampeonato = useMemo(() => {
    if (!campeonatoId) {
      return [];
    }

    return times.filter(
      (time) =>
        Number(time.campeonato_id) === Number(campeonatoId)
    );
  }, [times, campeonatoId]);

  const jogosFiltrados = useMemo(() => {
    if (!filtroCampeonatoId) {
      return jogos;
    }

    return jogos.filter(
      (jogo) =>
        Number(jogo.campeonato_id) === Number(filtroCampeonatoId)
    );
  }, [jogos, filtroCampeonatoId]);

  function selecionarCampeonato(valor: string) {
    setCampeonatoId(valor);
    setTimeCasaId("");
    setTimeVisitanteId("");
    setMensagem("");
  }

  async function cadastrarJogo() {
    setMensagem("");

    if (!campeonatoId) {
      setMensagem("Selecione o campeonato.");
      return;
    }

    if (!timeCasaId) {
      setMensagem("Selecione o time da casa.");
      return;
    }

    if (!timeVisitanteId) {
      setMensagem("Selecione o time visitante.");
      return;
    }

    if (timeCasaId === timeVisitanteId) {
      setMensagem(
        "O time da casa e o visitante não podem ser o mesmo."
      );
      return;
    }

    if (!dataJogo) {
      setMensagem("Informe a data do jogo.");
      return;
    }

    const timeCasa = times.find(
      (time) => Number(time.id) === Number(timeCasaId)
    );

    const timeVisitante = times.find(
      (time) => Number(time.id) === Number(timeVisitanteId)
    );

    if (!timeCasa || !timeVisitante) {
      setMensagem("Um dos times selecionados não foi encontrado.");
      return;
    }

    if (
      Number(timeCasa.campeonato_id) !== Number(campeonatoId) ||
      Number(timeVisitante.campeonato_id) !== Number(campeonatoId)
    ) {
      setMensagem(
        "Os dois times precisam pertencer ao campeonato selecionado."
      );
      return;
    }

    setCarregando(true);

    const { error } = await supabase
      .from("jogos")
      .insert([
        {
          campeonato_id: Number(campeonatoId),
          time_casa_id: Number(timeCasaId),
          time_visitante_id: Number(timeVisitanteId),
          gols_casa: 0,
          gols_visitante: 0,
          data_jogo: dataJogo,
          horario: horario || null,
          local: local.trim() || null,
          status,
        },
      ]);

    setCarregando(false);

    if (error) {
      console.error("Erro ao cadastrar jogo:", error);
      setMensagem(`Erro ao cadastrar jogo: ${error.message}`);
      return;
    }

    setTimeCasaId("");
    setTimeVisitanteId("");
    setDataJogo("");
    setHorario("");
    setLocal("");
    setStatus("agendado");

    setMensagem("Partida cadastrada com sucesso.");

    await carregarJogos();
  }

  function abrirResultado(jogo: Jogo) {
    setJogoResultadoId(jogo.id);
    setGolsCasa(String(jogo.gols_casa ?? 0));
    setGolsVisitante(String(jogo.gols_visitante ?? 0));
    setMensagem("");
  }

  function cancelarResultado() {
    setJogoResultadoId(null);
    setGolsCasa("");
    setGolsVisitante("");
  }

  async function salvarResultado(jogo: Jogo) {
    if (golsCasa === "" || golsVisitante === "") {
      setMensagem("Informe o placar completo.");
      return;
    }

    const golsCasaNumero = Number(golsCasa);
    const golsVisitanteNumero = Number(golsVisitante);

    if (
      Number.isNaN(golsCasaNumero) ||
      Number.isNaN(golsVisitanteNumero) ||
      golsCasaNumero < 0 ||
      golsVisitanteNumero < 0 ||
      !Number.isInteger(golsCasaNumero) ||
      !Number.isInteger(golsVisitanteNumero)
    ) {
      setMensagem("Informe um placar válido.");
      return;
    }

    const { error } = await supabase
      .from("jogos")
      .update({
        gols_casa: golsCasaNumero,
        gols_visitante: golsVisitanteNumero,
        status: "finalizado",
      })
      .eq("id", jogo.id);

    if (error) {
      console.error("Erro ao salvar resultado:", error);
      setMensagem(
        `Erro ao salvar resultado: ${error.message}`
      );
      return;
    }

    setMensagem("Resultado salvo com sucesso.");
    cancelarResultado();
    await carregarJogos();
  }

  async function excluirJogo(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir esta partida?"
    );

    if (!confirmou) {
      return;
    }

    const { error } = await supabase
      .from("jogos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir jogo:", error);
      setMensagem(`Erro ao excluir jogo: ${error.message}`);
      return;
    }

    setMensagem("Partida excluída com sucesso.");
    await carregarJogos();
  }

  function formatarData(data: string | null) {
    if (!data) {
      return "Data não informada";
    }

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(valor: string | null) {
    if (!valor) {
      return "";
    }

    return valor.slice(0, 5);
  }

  function nomeStatus(valor: string | null) {
    return (
      STATUS_OPCOES.find(
        (item) => item.value === valor
      )?.label ||
      valor ||
      "Agendado"
    );
  }

  function nomeCampeonato(jogo: Jogo) {
    if (!jogo.campeonato) {
      return "Sem campeonato";
    }

    const temporada =
      jogo.campeonato.ano ?? jogo.campeonato.temporada;

    return temporada
      ? `${jogo.campeonato.nome} • ${temporada}`
      : jogo.campeonato.nome;
  }

  return (
    <main className="min-h-screen bg-[#07140B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#34C759]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Jogos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Cadastre partidas por campeonato e lance os resultados.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">
            <h2 className="text-xl font-bold">
              Nova partida
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Campeonato
                </label>

                <select
                  value={campeonatoId}
                  onChange={(e) =>
                    selecionarCampeonato(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759]"
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

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time da casa
                </label>

                <select
                  value={timeCasaId}
                  onChange={(e) =>
                    setTimeCasaId(e.target.value)
                  }
                  disabled={!campeonatoId}
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {timesDoCampeonato.map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                      disabled={
                        Number(time.id) ===
                        Number(timeVisitanteId)
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

              <div className="text-center text-2xl font-black text-[#34C759]">
                X
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time visitante
                </label>

                <select
                  value={timeVisitanteId}
                  onChange={(e) =>
                    setTimeVisitanteId(e.target.value)
                  }
                  disabled={!campeonatoId}
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {timesDoCampeonato.map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                      disabled={
                        Number(time.id) ===
                        Number(timeCasaId)
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

              {campeonatoId &&
                timesDoCampeonato.length < 2 && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                    Este campeonato precisa ter pelo menos 2 times cadastrados.
                  </div>
                )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Data
                  </label>

                  <input
                    type="date"
                    value={dataJogo}
                    onChange={(e) =>
                      setDataJogo(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
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
                      setHorario(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
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
                    setLocal(e.target.value)
                  }
                  placeholder="Ex: Arena Municipal"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#34C759]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759]"
                >
                  {STATUS_OPCOES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={cadastrarJogo}
                disabled={
                  carregando ||
                  !campeonatoId ||
                  timesDoCampeonato.length < 2
                }
                className="w-full rounded-xl bg-[#00A500] px-4 py-3 font-black text-white transition hover:bg-[#14B814] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar partida"}
              </button>

              {mensagem && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  {mensagem}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Partidas cadastradas
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {jogosFiltrados.length} partida(s)
                </p>
              </div>

              <div className="w-full sm:w-72">
                <label className="mb-2 block text-xs text-white/40">
                  Filtrar campeonato
                </label>

                <select
                  value={filtroCampeonatoId}
                  onChange={(e) =>
                    setFiltroCampeonatoId(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#34C759]"
                >
                  <option value="">
                    Todos os campeonatos
                  </option>

                  {campeonatos.map((campeonato) => (
                    <option
                      key={campeonato.id}
                      value={campeonato.id}
                    >
                      {campeonato.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {jogosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhuma partida encontrada.
              </div>
            ) : (
              <div className="space-y-4">
                {jogosFiltrados.map((jogo) => (
                  <article
                    key={jogo.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#34C759]">
                          {nomeCampeonato(jogo)}
                        </p>

                        <span className="mt-2 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                          {nomeStatus(jogo.status)}
                        </span>
                      </div>

                      <span className="text-xs text-white/40">
                        {formatarData(jogo.data_jogo)}

                        {jogo.horario
                          ? ` • ${formatarHorario(jogo.horario)}`
                          : ""}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-5">
                      <div className="min-w-0 text-center">
                        {jogo.time_casa?.escudo_url ? (
                          <img
                            src={jogo.time_casa.escudo_url}
                            alt={jogo.time_casa.nome}
                            className="mx-auto h-14 w-14 object-contain sm:h-16 sm:w-16"
                          />
                        ) : (
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-sm font-bold sm:h-16 sm:w-16">
                            {jogo.time_casa?.sigla?.slice(0, 3) || "FC"}
                          </div>
                        )}

                        <p className="mt-3 truncate text-sm font-bold sm:text-base">
                          {jogo.time_casa?.nome || "Time"}
                        </p>
                      </div>

                      <div className="text-center">
                        {jogo.status === "finalizado" ? (
                          <div className="whitespace-nowrap text-2xl font-black sm:text-3xl">
                            {jogo.gols_casa ?? 0}

                            <span className="mx-2 text-white/30">
                              ×
                            </span>

                            {jogo.gols_visitante ?? 0}
                          </div>
                        ) : (
                          <span className="text-2xl font-black text-[#34C759] sm:text-3xl">
                            X
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 text-center">
                        {jogo.time_visitante?.escudo_url ? (
                          <img
                            src={jogo.time_visitante.escudo_url}
                            alt={jogo.time_visitante.nome}
                            className="mx-auto h-14 w-14 object-contain sm:h-16 sm:w-16"
                          />
                        ) : (
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-sm font-bold sm:h-16 sm:w-16">
                            {jogo.time_visitante?.sigla?.slice(0, 3) || "FC"}
                          </div>
                        )}

                        <p className="mt-3 truncate text-sm font-bold sm:text-base">
                          {jogo.time_visitante?.nome || "Time"}
                        </p>
                      </div>
                    </div>

                    {jogo.local && (
                      <p className="mt-4 text-center text-sm text-white/40">
                        {jogo.local}
                      </p>
                    )}

                    {jogoResultadoId === jogo.id ? (
                      <div className="mt-5 rounded-2xl border border-[#34C759]/20 bg-[#34C759]/5 p-4">
                        <p className="mb-4 text-sm font-bold text-[#34C759]">
                          Lançar resultado
                        </p>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={golsCasa}
                            onChange={(e) =>
                              setGolsCasa(e.target.value)
                            }
                            className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xl font-black outline-none focus:border-[#34C759]"
                          />

                          <span className="font-black text-white/30">
                            ×
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={golsVisitante}
                            onChange={(e) =>
                              setGolsVisitante(e.target.value)
                            }
                            className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xl font-black outline-none focus:border-[#34C759]"
                          />
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              salvarResultado(jogo)
                            }
                            className="flex-1 rounded-xl bg-[#00A500] px-4 py-3 font-bold text-white hover:bg-[#14B814]"
                          >
                            Salvar resultado
                          </button>

                          <button
                            type="button"
                            onClick={cancelarResultado}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 hover:bg-white/5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            abrirResultado(jogo)
                          }
                          className="flex-1 rounded-xl bg-[#00A500]/15 px-4 py-3 text-sm font-bold text-[#34C759] hover:bg-[#00A500]/25"
                        >
                          {jogo.status === "finalizado"
                            ? "Editar resultado"
                            : "Lançar resultado"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluirJogo(jogo.id)
                          }
                          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-400/20"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}