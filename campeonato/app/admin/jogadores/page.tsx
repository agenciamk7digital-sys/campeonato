"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  ano: number | null;
  temporada: string | null;
};

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
};

type TimeRelacionado = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;

  campeonato:
    | {
        id: number;
        nome: string;
        ano: number | null;
        temporada: string | null;
      }[]
    | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  posicao: string | null;
  foto_url: string | null;
  time_id: number | null;
  times: TimeRelacionado[] | null;
};

const POSICOES = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
];

export default function AdminJogadoresPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [campeonatoId, setCampeonatoId] =
    useState("");

  const [
    filtroCampeonatoId,
    setFiltroCampeonatoId,
  ] = useState("");

  const [filtroTimeId, setFiltroTimeId] =
    useState("");

  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [posicao, setPosicao] = useState("");
  const [timeId, setTimeId] = useState("");

  const [foto, setFoto] =
    useState<File | null>(null);

  const [previewFoto, setPreviewFoto] =
    useState<string | null>(null);

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
        ano,
        temporada
      `)
      .order("ano", { ascending: false })
      .order("nome", { ascending: true });

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

  async function carregarJogadores() {
    const { data, error } = await supabase
      .from("jogadores")
      .select(`
        id,
        nome,
        numero,
        posicao,
        foto_url,
        time_id,

        times (
          id,
          nome,
          sigla,
          escudo_url,
          campeonato_id,

          campeonato:campeonatos (
            id,
            nome,
            ano,
            temporada
          )
        )
      `)
      .order("nome", { ascending: true });

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
      (data ?? []) as unknown as Jogador[]
    );
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
    carregarJogadores();
  }, []);

  const timesDoCampeonato = useMemo(() => {
    if (!campeonatoId) {
      return [];
    }

    return times.filter(
      (time) =>
        Number(time.campeonato_id) ===
        Number(campeonatoId)
    );
  }, [times, campeonatoId]);

  const timesDoFiltro = useMemo(() => {
    if (!filtroCampeonatoId) {
      return times;
    }

    return times.filter(
      (time) =>
        Number(time.campeonato_id) ===
        Number(filtroCampeonatoId)
    );
  }, [times, filtroCampeonatoId]);

  function obterTime(jogador: Jogador) {
    if (
      !jogador.times ||
      jogador.times.length === 0
    ) {
      return null;
    }

    return jogador.times[0];
  }

  function obterCampeonato(
    jogador: Jogador
  ) {
    const time = obterTime(jogador);

    if (
      !time?.campeonato ||
      time.campeonato.length === 0
    ) {
      return null;
    }

    return time.campeonato[0];
  }

  const jogadoresFiltrados = useMemo(() => {
    return jogadores.filter((jogador) => {
      const time = obterTime(jogador);

      if (
        filtroCampeonatoId &&
        Number(time?.campeonato_id) !==
          Number(filtroCampeonatoId)
      ) {
        return false;
      }

      if (
        filtroTimeId &&
        Number(jogador.time_id) !==
          Number(filtroTimeId)
      ) {
        return false;
      }

      return true;
    });
  }, [
    jogadores,
    filtroCampeonatoId,
    filtroTimeId,
  ]);

  function selecionarCampeonato(
    valor: string
  ) {
    setCampeonatoId(valor);
    setTimeId("");
    setMensagem("");
  }

  function selecionarFiltroCampeonato(
    valor: string
  ) {
    setFiltroCampeonatoId(valor);
    setFiltroTimeId("");
  }

  function selecionarFoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      setFoto(null);
      setPreviewFoto(null);
      return;
    }

    if (
      !arquivo.type.startsWith("image/")
    ) {
      setMensagem(
        "Selecione uma imagem válida."
      );

      return;
    }

    const limite =
      5 * 1024 * 1024;

    if (arquivo.size > limite) {
      setMensagem(
        "A foto deve ter no máximo 5 MB."
      );

      return;
    }

    if (previewFoto) {
      URL.revokeObjectURL(previewFoto);
    }

    setFoto(arquivo);

    setPreviewFoto(
      URL.createObjectURL(arquivo)
    );

    setMensagem("");
  }

  async function enviarFoto() {
    if (!foto) {
      return null;
    }

    const extensao =
      foto.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } =
      await supabase.storage
        .from("jogadores")
        .upload(nomeArquivo, foto, {
          cacheControl: "3600",
          upsert: false,
        });

    if (error) {
      throw new Error(error.message);
    }

    const { data } =
      supabase.storage
        .from("jogadores")
        .getPublicUrl(nomeArquivo);

    return data.publicUrl;
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
        "Selecione o time do jogador."
      );

      return;
    }

    if (!nome.trim()) {
      setMensagem(
        "Informe o nome do jogador."
      );

      return;
    }

    if (!posicao) {
      setMensagem(
        "Selecione a posição do jogador."
      );

      return;
    }

    const timeSelecionado =
      times.find(
        (time) =>
          Number(time.id) ===
          Number(timeId)
      );

    if (!timeSelecionado) {
      setMensagem(
        "Time não encontrado."
      );

      return;
    }

    if (
      Number(
        timeSelecionado.campeonato_id
      ) !== Number(campeonatoId)
    ) {
      setMensagem(
        "Este time não pertence ao campeonato selecionado."
      );

      return;
    }

    if (numero) {
      const numeroConvertido =
        Number(numero);

      if (
        Number.isNaN(numeroConvertido) ||
        numeroConvertido < 1 ||
        numeroConvertido > 99
      ) {
        setMensagem(
          "O número da camisa deve estar entre 1 e 99."
        );

        return;
      }
    }

    setCarregando(true);

    try {
      let fotoUrl:
        | string
        | null = null;

      if (foto) {
        fotoUrl = await enviarFoto();
      }

      const { error } =
        await supabase
          .from("jogadores")
          .insert([
            {
              nome: nome.trim(),

              numero: numero
                ? Number(numero)
                : null,

              posicao,

              foto_url: fotoUrl,

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
      setPosicao("");
      setTimeId("");
      setFoto(null);

      if (previewFoto) {
        URL.revokeObjectURL(
          previewFoto
        );
      }

      setPreviewFoto(null);

      setMensagem(
        "Jogador cadastrado com sucesso."
      );

      await carregarJogadores();
    } catch (error) {
      console.error(
        "Erro ao cadastrar jogador:",
        error
      );

      if (error instanceof Error) {
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

    const jogador =
      jogadores.find(
        (item) => item.id === id
      );

    if (jogador?.foto_url) {
      const marcador =
        "/storage/v1/object/public/jogadores/";

      const posicaoMarcador =
        jogador.foto_url.indexOf(
          marcador
        );

      if (
        posicaoMarcador !== -1
      ) {
        const caminho =
          jogador.foto_url.substring(
            posicaoMarcador +
              marcador.length
          );

        const {
          error: storageError,
        } =
          await supabase.storage
            .from("jogadores")
            .remove([caminho]);

        if (storageError) {
          console.error(
            "Erro ao excluir foto:",
            storageError
          );
        }
      }
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

  function nomeCampeonato(
    jogador: Jogador
  ) {
    const campeonato =
      obterCampeonato(jogador);

    if (!campeonato) {
      return "Sem campeonato";
    }

    const temporada =
      campeonato.ano ??
      campeonato.temporada;

    if (temporada) {
      return `${campeonato.nome} • ${temporada}`;
    }

    return campeonato.nome;
  }

  return (
    <main className="min-h-screen bg-[#07140B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#34C759]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Jogadores
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Cadastre jogadores por
            campeonato e por time.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">

            <h2 className="text-xl font-bold">
              Cadastrar jogador
            </h2>

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
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#34C759]"
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

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Time
                </label>

                <select
                  value={timeId}
                  onChange={(e) =>
                    setTimeId(
                      e.target.value
                    )
                  }
                  disabled={!campeonatoId}
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#34C759] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">
                    Selecione o time
                  </option>

                  {timesDoCampeonato.map(
                    (time) => (
                      <option
                        key={time.id}
                        value={time.id}
                      >
                        {time.nome}

                        {time.sigla
                          ? ` (${time.sigla})`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {campeonatoId &&
                  timesDoCampeonato.length ===
                    0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      Este campeonato
                      ainda não possui
                      times cadastrados.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Nome
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
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#34C759]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Número
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={numero}
                    onChange={(e) =>
                      setNumero(
                        e.target.value
                      )
                    }
                    placeholder="10"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/25 focus:border-[#34C759]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Posição
                  </label>

                  <select
                    value={posicao}
                    onChange={(e) =>
                      setPosicao(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759]"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {POSICOES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Foto
                </label>

                <label className="flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center transition hover:bg-white/[0.06]">

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      selecionarFoto
                    }
                    className="hidden"
                  />

                  {previewFoto ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={
                          previewFoto
                        }
                        alt="Prévia do jogador"
                        className="h-28 w-28 rounded-2xl object-cover"
                      />

                      <span className="mt-3 text-sm text-white/50">
                        Clique para trocar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">
                        Selecionar foto
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        PNG, JPG ou WEBP
                        • até 5 MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <button
                type="button"
                onClick={
                  cadastrarJogador
                }
                disabled={carregando}
                className="w-full rounded-xl bg-[#00A500] px-4 py-3 font-black text-white transition hover:bg-[#14B814] disabled:cursor-not-allowed disabled:opacity-50"
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

          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">

            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Jogadores cadastrados
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {
                  jogadoresFiltrados.length
                }{" "}
                jogador(es)
              </p>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Filtrar campeonato
                </label>

                <select
                  value={
                    filtroCampeonatoId
                  }
                  onChange={(e) =>
                    selecionarFiltroCampeonato(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#34C759]"
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

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Filtrar time
                </label>

                <select
                  value={filtroTimeId}
                  onChange={(e) =>
                    setFiltroTimeId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-sm outline-none focus:border-[#34C759]"
                >
                  <option value="">
                    Todos os times
                  </option>

                  {timesDoFiltro.map(
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

            {jogadoresFiltrados.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhum jogador
                encontrado.
              </div>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">

                {jogadoresFiltrados.map(
                  (jogador) => {
                    const time =
                      obterTime(
                        jogador
                      );

                    return (
                      <article
                        key={
                          jogador.id
                        }
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center gap-4">

                          {jogador.foto_url ? (
                            <img
                              src={
                                jogador.foto_url
                              }
                              alt={
                                jogador.nome
                              }
                              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white/50">
                              {jogador.numero ||
                                "?"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="truncate font-black">
                                {
                                  jogador.nome
                                }
                              </h3>

                              {jogador.numero && (
                                <span className="rounded-md bg-[#00A500]/15 px-2 py-1 text-xs font-bold text-[#34C759]">
                                  #
                                  {
                                    jogador.numero
                                  }
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-white/45">
                              {jogador.posicao ||
                                "Sem posição"}
                            </p>

                            {time && (
                              <div className="mt-2 flex items-center gap-2">

                                {time.escudo_url && (
                                  <img
                                    src={
                                      time.escudo_url
                                    }
                                    alt={
                                      time.nome
                                    }
                                    className="h-5 w-5 object-contain"
                                  />
                                )}

                                <span className="truncate text-xs text-white/50">
                                  {
                                    time.nome
                                  }
                                </span>
                              </div>
                            )}

                            <p className="mt-1 truncate text-xs font-semibold text-[#34C759]">
                              {nomeCampeonato(
                                jogador
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
                          className="mt-4 w-full rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                        >
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