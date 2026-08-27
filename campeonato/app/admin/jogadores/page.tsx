"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Trash2,
  UserRound,
  Users,
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
  campeonato_id: number | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  time_id: number | null;
};

export default function AdminJogadoresPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [campeonatoId, setCampeonatoId] =
    useState("");

  const [timeId, setTimeId] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [numero, setNumero] =
    useState("");

  const [fotoUrl, setFotoUrl] =
    useState("");

  const [
    filtroCampeonatoId,
    setFiltroCampeonatoId,
  ] = useState("");

  const [filtroTimeId, setFiltroTimeId] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  async function carregarCampeonatos() {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

    setTimes(
      (data ?? []) as Time[]
    );
  }

  async function carregarJogadores() {
    const { data, error } = await supabase
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
      });

    if (error) {
      console.error(
        "Erro ao carregar jogadores:",
        error
      );

      setMensagem(
        `Erro ao carregar jogadores: ${error.message}`
      );

      return;
    }

    setJogadores(
      (data ?? []) as Jogador[]
    );
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
    carregarJogadores();

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const campeonatoUrl =
      parametros.get("campeonato") || "";

    const timeUrl =
      parametros.get("time") || "";

    if (campeonatoUrl) {
      setCampeonatoId(
        campeonatoUrl
      );

      setFiltroCampeonatoId(
        campeonatoUrl
      );
    }

    if (timeUrl) {
      setTimeId(timeUrl);
      setFiltroTimeId(timeUrl);
    }
  }, []);

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
          Number(
            campeonatoId
          )
      );
    }, [
      times,
      campeonatoId,
    ]);

  const timesFiltro =
    useMemo(() => {
      if (!filtroCampeonatoId) {
        return times;
      }

      return times.filter(
        (time) =>
          Number(
            time.campeonato_id
          ) ===
          Number(
            filtroCampeonatoId
          )
      );
    }, [
      times,
      filtroCampeonatoId,
    ]);

  const jogadoresFiltrados =
    useMemo(() => {
      return jogadores.filter(
        (jogador) => {
          const time =
            times.find(
              (item) =>
                Number(item.id) ===
                Number(
                  jogador.time_id
                )
            );

          if (
            filtroCampeonatoId &&
            Number(
              time?.campeonato_id
            ) !==
              Number(
                filtroCampeonatoId
              )
          ) {
            return false;
          }

          if (
            filtroTimeId &&
            Number(
              jogador.time_id
            ) !==
              Number(
                filtroTimeId
              )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      jogadores,
      times,
      filtroCampeonatoId,
      filtroTimeId,
    ]);

  function obterTime(
    jogador: Jogador
  ) {
    return (
      times.find(
        (time) =>
          Number(time.id) ===
          Number(
            jogador.time_id
          )
      ) ?? null
    );
  }

  function obterCampeonato(
    time: Time | null
  ) {
    if (!time) {
      return null;
    }

    return (
      campeonatos.find(
        (campeonato) =>
          Number(
            campeonato.id
          ) ===
          Number(
            time.campeonato_id
          )
      ) ?? null
    );
  }

  function tituloCampeonato(
    campeonato: Campeonato | null
  ) {
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

  async function cadastrarJogador() {
    setMensagem("");

    if (!campeonatoId) {
      setMensagem(
        "Selecione o campeonato."
      );

      return;
    }

    if (!timeId) {
      setMensagem(
        "Selecione o time."
      );

      return;
    }

    if (!nome.trim()) {
      setMensagem(
        "Informe o nome do jogador."
      );

      return;
    }

    if (
      numero &&
      (
        Number.isNaN(
          Number(numero)
        ) ||
        Number(numero) < 0
      )
    ) {
      setMensagem(
        "Informe um número de camisa válido."
      );

      return;
    }

    setCarregando(true);

    try {
      const { error } =
        await supabase
          .from("jogadores")
          .insert([
            {
              nome:
                nome.trim(),

              numero:
                numero
                  ? Number(numero)
                  : null,

              foto_url:
                fotoUrl.trim() ||
                null,

              time_id:
                Number(timeId),
            },
          ]);

      if (error) {
        throw new Error(
          error.message
        );
      }

      setNome("");
      setNumero("");
      setFotoUrl("");

      setFiltroCampeonatoId(
        campeonatoId
      );

      setFiltroTimeId(
        timeId
      );

      setMensagem(
        "Jogador cadastrado com sucesso."
      );

      await carregarJogadores();
    } catch (error) {
      console.error(
        "Erro ao cadastrar jogador:",
        error
      );

      if (
        error instanceof Error
      ) {
        setMensagem(
          `Erro ao cadastrar: ${error.message}`
        );
      } else {
        setMensagem(
          "Erro ao cadastrar jogador."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  async function excluirJogador(
    id: number
  ) {
    const confirmou =
      window.confirm(
        "Tem certeza que deseja excluir este jogador?"
      );

    if (!confirmou) {
      return;
    }

    const { error } =
      await supabase
        .from("jogadores")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Erro ao excluir jogador:",
        error
      );

      setMensagem(
        `Erro ao excluir: ${error.message}`
      );

      return;
    }

    setMensagem(
      "Jogador excluído com sucesso."
    );

    await carregarJogadores();
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#18C929]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Jogadores
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Cadastre os jogadores e
            vincule cada atleta ao seu
            time e campeonato.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          {/* CADASTRO */}
          <section className="rounded-3xl border border-white/[0.08] bg-[#0D1F12] p-5 sm:p-6">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                <UserRound
                  size={21}
                />
              </div>

              <h2 className="text-xl font-black">
                Cadastrar jogador
              </h2>
            </div>

            <div className="mt-6 space-y-5">

              {/* CAMPEONATO */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Campeonato
                </label>

                <select
                  value={
                    campeonatoId
                  }
                  onChange={(e) => {
                    setCampeonatoId(
                      e.target.value
                    );

                    setTimeId("");

                    setFiltroCampeonatoId(
                      e.target.value
                    );

                    setFiltroTimeId("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929]"
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

              {/* TIME */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time
                </label>

                <select
                  value={timeId}
                  onChange={(e) => {
                    setTimeId(
                      e.target.value
                    );

                    setFiltroTimeId(
                      e.target.value
                    );
                  }}
                  disabled={
                    !campeonatoId
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#18C929] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    {campeonatoId
                      ? "Selecione o time"
                      : "Selecione primeiro o campeonato"}
                  </option>

                  {timesDoCampeonato.map(
                    (time) => (
                      <option
                        key={time.id}
                        value={time.id}
                      >
                        {time.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* NOME */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Nome do jogador
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#18C929]"
                />
              </div>

              {/* NÚMERO */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Número da camisa
                </label>

                <input
                  type="number"
                  value={numero}
                  onChange={(e) =>
                    setNumero(
                      e.target.value
                    )
                  }
                  min="0"
                  placeholder="Ex: 10"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#18C929]"
                />
              </div>

              {/* FOTO */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  URL da foto
                </label>

                <input
                  type="url"
                  value={fotoUrl}
                  onChange={(e) =>
                    setFotoUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#18C929]"
                />

                <p className="mt-2 text-xs text-white/30">
                  A foto é opcional.
                </p>
              </div>

              {fotoUrl && (
                <div className="flex justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <img
                    src={fotoUrl}
                    alt="Prévia do jogador"
                    className="h-28 w-28 rounded-2xl object-cover"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={
                  cadastrarJogador
                }
                disabled={
                  carregando
                }
                className="w-full rounded-xl bg-[#18C929] px-4 py-3 font-black text-black transition hover:bg-[#2DDF3B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar jogador"}
              </button>

              {mensagem && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  {mensagem}
                </div>
              )}
            </div>
          </section>

          {/* LISTAGEM */}
          <section className="rounded-3xl border border-white/[0.08] bg-[#0D1F12] p-5 sm:p-6">

            <div className="mb-6">

              <div>
                <h2 className="text-xl font-black">
                  Jogadores cadastrados
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {
                    jogadoresFiltrados.length
                  }{" "}
                  jogador(es)
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                {/* FILTRO CAMPEONATO */}
                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Filtrar campeonato
                  </label>

                  <select
                    value={
                      filtroCampeonatoId
                    }
                    onChange={(e) => {
                      setFiltroCampeonatoId(
                        e.target.value
                      );

                      setFiltroTimeId("");
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#18C929]"
                  >
                    <option value="">
                      Todos
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
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* FILTRO TIME */}
                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Filtrar time
                  </label>

                  <select
                    value={
                      filtroTimeId
                    }
                    onChange={(e) =>
                      setFiltroTimeId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#18C929]"
                  >
                    <option value="">
                      Todos
                    </option>

                    {timesFiltro.map(
                      (time) => (
                        <option
                          key={time.id}
                          value={time.id}
                        >
                          {time.nome}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {jogadoresFiltrados.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">

                <Users
                  size={34}
                  className="mx-auto text-white/20"
                />

                <p className="mt-3 text-white/40">
                  Nenhum jogador encontrado.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {jogadoresFiltrados.map(
                  (jogador) => {
                    const time =
                      obterTime(
                        jogador
                      );

                    const campeonato =
                      obterCampeonato(
                        time
                      );

                    return (
                      <article
                        key={
                          jogador.id
                        }
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center gap-4">

                          {/* FOTO */}
                          {jogador.foto_url ? (
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">

                              <img
                                src={
                                  jogador.foto_url
                                }
                                alt={
                                  jogador.nome
                                }
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#18C929]/10 text-[#18C929]">
                              <UserRound
                                size={27}
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2">

                              <h3 className="truncate font-black">
                                {
                                  jogador.nome
                                }
                              </h3>

                              {jogador.numero !==
                                null && (
                                <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[#18C929]/10 px-2 text-xs font-black text-[#18C929]">
                                  {
                                    jogador.numero
                                  }
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs font-semibold text-[#18C929]">
                              {time?.nome ??
                                "Sem time"}
                            </p>

                            <p className="mt-1 truncate text-xs text-white/40">
                              {tituloCampeonato(
                                campeonato
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            excluirJogador(
                              jogador.id
                            )
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                        >
                          <Trash2
                            size={15}
                          />

                          Excluir
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}