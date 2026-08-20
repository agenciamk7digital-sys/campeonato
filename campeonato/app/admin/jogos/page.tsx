"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
};

type Jogo = {
  id: number;
  time_casa_id: number;
  time_visitante_id: number;
  gols_casa: number | null;
  gols_visitante: number | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;

  time_casa: {
    id: number;
    nome: string;
    sigla: string | null;
    escudo_url: string | null;
  } | null;

  time_visitante: {
    id: number;
    nome: string;
    sigla: string | null;
    escudo_url: string | null;
  } | null;
};

const STATUS_OPCOES = [
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "adiado", label: "Adiado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function AdminJogosPage() {
  const [times, setTimes] = useState<Time[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);

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

  async function carregarTimes() {
    const { data, error } = await supabase
      .from("times")
      .select(`
        id,
        nome,
        sigla,
        escudo_url
      `)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar times:", error);

      setMensagem(
        `Erro ao carregar times: ${error.message}`
      );

      return;
    }

    setTimes(data ?? []);
  }

  async function carregarJogos() {
    const { data, error } = await supabase
      .from("jogos")
      .select(`
        id,
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
    carregarTimes();
    carregarJogos();
  }, []);

  async function cadastrarJogo() {
    setMensagem("");

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

    setCarregando(true);

    const { error } = await supabase
      .from("jogos")
      .insert([
        {
          campeonato_id: null,
          time_casa_id: Number(timeCasaId),
          time_visitante_id:
            Number(timeVisitanteId),

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
      console.error(
        "Erro ao cadastrar jogo:",
        error
      );

      setMensagem(
        `Erro ao cadastrar jogo: ${error.message}`
      );

      return;
    }

    setTimeCasaId("");
    setTimeVisitanteId("");
    setDataJogo("");
    setHorario("");
    setLocal("");
    setStatus("agendado");

    setMensagem(
      "Partida cadastrada com sucesso."
    );

    await carregarJogos();
  }

  function abrirResultado(jogo: Jogo) {
    setJogoResultadoId(jogo.id);

    setGolsCasa(
      String(jogo.gols_casa ?? 0)
    );

    setGolsVisitante(
      String(jogo.gols_visitante ?? 0)
    );

    setMensagem("");
  }

  function cancelarResultado() {
    setJogoResultadoId(null);
    setGolsCasa("");
    setGolsVisitante("");
  }

  async function salvarResultado(
    jogo: Jogo
  ) {
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
      Number(golsVisitante);

    if (
      Number.isNaN(golsCasaNumero) ||
      Number.isNaN(golsVisitanteNumero) ||
      golsCasaNumero < 0 ||
      golsVisitanteNumero < 0
    ) {
      setMensagem(
        "Informe um placar válido."
      );

      return;
    }

    const { error } = await supabase
      .from("jogos")
      .update({
        gols_casa: golsCasaNumero,
        gols_visitante:
          golsVisitanteNumero,

        status: "finalizado",
      })
      .eq("id", jogo.id);

    if (error) {
      console.error(
        "Erro ao salvar resultado:",
        error
      );

      setMensagem(
        `Erro ao salvar resultado: ${error.message}`
      );

      return;
    }

    setMensagem(
      "Resultado salvo com sucesso."
    );

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

    if (!confirmirmouSeguro(confirmou)) {
      return;
    }

    const { error } = await supabase
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

  function confirmirmouSeguro(
    confirmou: boolean
  ) {
    return confirmou;
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return "Data não informada";
    }

    const [ano, mes, dia] =
      data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarHorario(
    valor: string | null
  ) {
    if (!valor) {
      return "";
    }

    return valor.slice(0, 5);
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

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Jogos
          </h1>

          <p className="mt-2 text-white/50">
            Cadastre partidas e lance os
            resultados do campeonato.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          {/* CADASTRO */}

          <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">

            <h2 className="text-xl font-bold">
              Nova partida
            </h2>

            <div className="mt-6 space-y-5">

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
                  className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {times.map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                    >
                      {time.nome}
                      {time.sigla
                        ? ` (${time.sigla})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-2xl font-black text-white/30">
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
                  className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {times.map((time) => (
                    <option
                      key={time.id}
                      value={time.id}
                    >
                      {time.nome}

                      {time.sigla
                        ? ` (${time.sigla})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">

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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
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
                  className="w-full rounded-xl border border-white/10 bg-[#16263a] px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {STATUS_OPCOES.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={cadastrarJogo}
                disabled={carregando}
                className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#07111f] transition hover:bg-emerald-300 disabled:opacity-50"
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

          {/* PARTIDAS */}

          <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">

            <div className="mb-6">

              <h2 className="text-xl font-bold">
                Partidas cadastradas
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {jogos.length} partida(s)
              </p>

            </div>

            {jogos.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhuma partida cadastrada.
              </div>

            ) : (

              <div className="space-y-4">

                {jogos.map((jogo) => (

                  <div
                    key={jogo.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                        {nomeStatus(
                          jogo.status
                        )}
                      </span>

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

                    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                      {/* CASA */}

                      <div className="text-center">

                        {jogo.time_casa
                          ?.escudo_url ? (

                          <img
                            src={
                              jogo
                                .time_casa
                                .escudo_url
                            }
                            alt={
                              jogo
                                .time_casa
                                .nome
                            }
                            className="mx-auto h-16 w-16 object-contain"
                          />

                        ) : (

                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-bold">
                            {jogo
                              .time_casa
                              ?.sigla
                              ?.slice(
                                0,
                                2
                              ) ||
                              "FC"}
                          </div>

                        )}

                        <p className="mt-3 font-bold">
                          {jogo.time_casa
                            ?.nome ||
                            "Time"}
                        </p>

                      </div>

                      {/* PLACAR */}

                      <div className="text-center">

                        {jogo.status ===
                        "finalizado" ? (

                          <div className="text-3xl font-black">

                            {jogo.gols_casa ??
                              0}

                            <span className="mx-2 text-white/30">
                              ×
                            </span>

                            {jogo.gols_visitante ??
                              0}

                          </div>

                        ) : (

                          <span className="text-3xl font-black text-white/30">
                            X
                          </span>

                        )}

                      </div>

                      {/* VISITANTE */}

                      <div className="text-center">

                        {jogo
                          .time_visitante
                          ?.escudo_url ? (

                          <img
                            src={
                              jogo
                                .time_visitante
                                .escudo_url
                            }
                            alt={
                              jogo
                                .time_visitante
                                .nome
                            }
                            className="mx-auto h-16 w-16 object-contain"
                          />

                        ) : (

                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-bold">

                            {jogo
                              .time_visitante
                              ?.sigla
                              ?.slice(
                                0,
                                2
                              ) ||
                              "FC"}

                          </div>

                        )}

                        <p className="mt-3 font-bold">

                          {jogo
                            .time_visitante
                            ?.nome ||
                            "Time"}

                        </p>

                      </div>

                    </div>

                    {jogo.local && (

                      <p className="mt-4 text-center text-sm text-white/40">
                        {jogo.local}
                      </p>

                    )}

                    {jogoResultadoId ===
                    jogo.id ? (

                      <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">

                        <p className="mb-4 text-sm font-semibold text-emerald-300">
                          Lançar resultado
                        </p>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">

                          <input
                            type="number"
                            min="0"
                            value={
                              golsCasa
                            }
                            onChange={(
                              e
                            ) =>
                              setGolsCasa(
                                e.target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl font-bold outline-none focus:border-emerald-400"
                          />

                          <span className="font-bold text-white/30">
                            ×
                          </span>

                          <input
                            type="number"
                            min="0"
                            value={
                              golsVisitante
                            }
                            onChange={(
                              e
                            ) =>
                              setGolsVisitante(
                                e.target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl font-bold outline-none focus:border-emerald-400"
                          />

                        </div>

                        <div className="mt-4 flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              salvarResultado(
                                jogo
                              )
                            }
                            className="flex-1 rounded-xl bg-emerald-400 px-4 py-2 font-bold text-[#07111f]"
                          >
                            Salvar resultado
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelarResultado
                            }
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"
                          >
                            Cancelar
                          </button>

                        </div>

                      </div>

                    ) : (

                      <div className="mt-5 flex flex-wrap gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            abrirResultado(
                              jogo
                            )
                          }
                          className="rounded-xl bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/20"
                        >
                          {jogo.status ===
                          "finalizado"
                            ? "Editar resultado"
                            : "Lançar resultado"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluirJogo(
                              jogo.id
                            )
                          }
                          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20"
                        >
                          Excluir
                        </button>

                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

      </div>
    </main>
  );
}