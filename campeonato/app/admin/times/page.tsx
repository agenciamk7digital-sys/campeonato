"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  cidade: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
  campeonato:
    | {
        id: number;
        nome: string;
        ano: number | null;
        temporada: string | null;
      }
    | null;
};

export default function AdminTimesPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);

  const [campeonatoId, setCampeonatoId] = useState("");
  const [filtroCampeonatoId, setFiltroCampeonatoId] = useState("");

  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [cidade, setCidade] = useState("");

  const [escudo, setEscudo] = useState<File | null>(null);
  const [previewEscudo, setPreviewEscudo] = useState<string | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

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
      console.error("Erro ao carregar campeonatos:", error);
      setMensagem(`Erro ao carregar campeonatos: ${error.message}`);
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
        cidade,
        escudo_url,
        campeonato_id,

        campeonato:campeonatos (
          id,
          nome,
          ano,
          temporada
        )
      `)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar times:", error);
      setMensagem(`Erro ao carregar times: ${error.message}`);
      return;
    }

    setTimes((data ?? []) as unknown as Time[]);
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
  }, []);

  const timesFiltrados = useMemo(() => {
    if (!filtroCampeonatoId) {
      return times;
    }

    return times.filter(
      (time) =>
        Number(time.campeonato_id) === Number(filtroCampeonatoId)
    );
  }, [times, filtroCampeonatoId]);

  function selecionarEscudo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      setEscudo(null);
      setPreviewEscudo(null);
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setMensagem("Selecione uma imagem válida.");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem("O escudo deve ter no máximo 5 MB.");
      return;
    }

    if (previewEscudo) {
      URL.revokeObjectURL(previewEscudo);
    }

    setEscudo(arquivo);
    setPreviewEscudo(URL.createObjectURL(arquivo));
    setMensagem("");
  }

  async function enviarEscudo() {
    if (!escudo) {
      return null;
    }

    const extensao =
      escudo.name.split(".").pop()?.toLowerCase() || "png";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("escudos")
      .upload(nomeArquivo, escudo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("escudos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function cadastrarTime() {
    setMensagem("");

    if (!campeonatoId) {
      setMensagem("Selecione o campeonato.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe o nome do time.");
      return;
    }

    setCarregando(true);

    try {
      let escudoUrl: string | null = null;

      if (escudo) {
        escudoUrl = await enviarEscudo();
      }

      const { error } = await supabase
        .from("times")
        .insert([
          {
            campeonato_id: Number(campeonatoId),
            nome: nome.trim(),
            sigla: sigla.trim() || null,
            cidade: cidade.trim() || null,
            escudo_url: escudoUrl,
          },
        ]);

      if (error) {
        throw new Error(error.message);
      }

      setNome("");
      setSigla("");
      setCidade("");
      setEscudo(null);

      if (previewEscudo) {
        URL.revokeObjectURL(previewEscudo);
      }

      setPreviewEscudo(null);

      setMensagem("Time cadastrado com sucesso.");

      await carregarTimes();
    } catch (error) {
      console.error("Erro ao cadastrar time:", error);

      if (error instanceof Error) {
        setMensagem(`Erro ao cadastrar: ${error.message}`);
      } else {
        setMensagem("Erro ao cadastrar time.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function excluirTime(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este time?"
    );

    if (!confirmou) return;

    const time = times.find((item) => item.id === id);

    if (time?.escudo_url) {
      const marcador =
        "/storage/v1/object/public/escudos/";

      const posicao =
        time.escudo_url.indexOf(marcador);

      if (posicao !== -1) {
        const caminho =
          time.escudo_url.substring(
            posicao + marcador.length
          );

        await supabase.storage
          .from("escudos")
          .remove([caminho]);
      }
    }

    const { error } = await supabase
      .from("times")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir time:", error);
      setMensagem(`Erro ao excluir: ${error.message}`);
      return;
    }

    setMensagem("Time excluído com sucesso.");

    await carregarTimes();
  }

  function nomeCampeonato(time: Time) {
    if (!time.campeonato) {
      return "Sem campeonato";
    }

    const temporada =
      time.campeonato.ano ??
      time.campeonato.temporada;

    return temporada
      ? `${time.campeonato.nome} • ${temporada}`
      : time.campeonato.nome;
  }

  return (
    <main className="min-h-screen bg-[#07140B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#34C759]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Times
          </h1>

          <p className="mt-2 text-sm text-white/50 sm:text-base">
            Cadastre os times e vincule cada um ao campeonato correto.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">
            <h2 className="text-xl font-bold">
              Cadastrar time
            </h2>

            <div className="mt-6 space-y-5">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Campeonato
                </label>

                <select
                  value={campeonatoId}
                  onChange={(e) =>
                    setCampeonatoId(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 text-white outline-none focus:border-[#34C759]"
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

                {campeonatos.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300">
                    Cadastre primeiro um campeonato.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Nome do time
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  placeholder="Ex: FJU Central"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#34C759]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Sigla
                </label>

                <input
                  type="text"
                  value={sigla}
                  onChange={(e) =>
                    setSigla(
                      e.target.value.toUpperCase()
                    )
                  }
                  maxLength={5}
                  placeholder="Ex: FJC"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#34C759]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Cidade
                </label>

                <input
                  type="text"
                  value={cidade}
                  onChange={(e) =>
                    setCidade(e.target.value)
                  }
                  placeholder="Ex: Belo Horizonte"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#34C759]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Escudo
                </label>

                <label className="flex min-h-36 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center hover:bg-white/[0.06]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={selecionarEscudo}
                    className="hidden"
                  />

                  {previewEscudo ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={previewEscudo}
                        alt="Prévia do escudo"
                        className="h-24 w-24 object-contain"
                      />

                      <span className="mt-3 text-sm text-white/50">
                        Clique para trocar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">
                        Selecionar escudo
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        PNG, JPG ou WEBP • até 5 MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <button
                type="button"
                onClick={cadastrarTime}
                disabled={carregando}
                className="w-full rounded-xl bg-[#00A500] px-4 py-3 font-black text-white transition hover:bg-[#14B814] disabled:opacity-50"
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar time"}
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
                  Times cadastrados
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {timesFiltrados.length} time(s)
                </p>
              </div>

              <div className="w-full sm:w-64">
                <label className="mb-2 block text-xs text-white/40">
                  Filtrar campeonato
                </label>

                <select
                  value={filtroCampeonatoId}
                  onChange={(e) =>
                    setFiltroCampeonatoId(
                      e.target.value
                    )
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

            {timesFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhum time encontrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {timesFiltrados.map((time) => (
                  <article
                    key={time.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-4">
                      {time.escudo_url ? (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2">
                          <img
                            src={time.escudo_url}
                            alt={time.nome}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-black text-white/50">
                          {time.sigla?.slice(0, 3) || "FC"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="truncate font-black">
                          {time.nome}
                        </h3>

                        <p className="mt-1 text-xs text-[#34C759]">
                          {nomeCampeonato(time)}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {time.sigla || "Sem sigla"}
                          {time.cidade
                            ? ` • ${time.cidade}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        excluirTime(time.id)
                      }
                      className="mt-4 w-full rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-400/20"
                    >
                      Excluir
                    </button>
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