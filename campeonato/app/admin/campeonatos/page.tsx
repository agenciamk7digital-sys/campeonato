"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  descricao: string | null;
  logo_url: string | null;
  status: string | null;
};

export default function AdminCampeonatosPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);

  const [nome, setNome] = useState("");
  const [temporada, setTemporada] = useState("");
  const [ano, setAno] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("ativo");

  const [logo, setLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarCampeonatos() {
    const { data, error } = await supabase
      .from("campeonatos")
      .select(`
        id,
        nome,
        temporada,
        ano,
        descricao,
        logo_url,
        status
      `)
      .order("ano", { ascending: false })
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      setMensagem(`Erro ao carregar campeonatos: ${error.message}`);
      return;
    }

    setCampeonatos(data ?? []);
  }

  useEffect(() => {
    carregarCampeonatos();
  }, []);

  function selecionarLogo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      setLogo(null);
      setPreviewLogo(null);
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setMensagem("Selecione uma imagem válida.");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem("A logo deve ter no máximo 5 MB.");
      return;
    }

    if (previewLogo) {
      URL.revokeObjectURL(previewLogo);
    }

    setLogo(arquivo);
    setPreviewLogo(URL.createObjectURL(arquivo));
    setMensagem("");
  }

  async function enviarLogo() {
    if (!logo) return null;

    const extensao =
      logo.name.split(".").pop()?.toLowerCase() || "png";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("campeonatos")
      .upload(nomeArquivo, logo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("campeonatos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function cadastrarCampeonato() {
    setMensagem("");

    if (!nome.trim()) {
      setMensagem("Informe o nome do campeonato.");
      return;
    }

    setCarregando(true);

    try {
      const logoUrl = await enviarLogo();

      const { error } = await supabase
        .from("campeonatos")
        .insert([
          {
            nome: nome.trim(),
            temporada: temporada.trim() || null,
            ano: ano ? Number(ano) : null,
            descricao: descricao.trim() || null,
            logo_url: logoUrl,
            status,
          },
        ]);

      if (error) {
        throw new Error(error.message);
      }

      setNome("");
      setTemporada("");
      setAno("");
      setDescricao("");
      setStatus("ativo");
      setLogo(null);

      if (previewLogo) {
        URL.revokeObjectURL(previewLogo);
      }

      setPreviewLogo(null);

      setMensagem("Campeonato cadastrado com sucesso.");

      await carregarCampeonatos();
    } catch (error) {
      if (error instanceof Error) {
        setMensagem(`Erro ao cadastrar: ${error.message}`);
      } else {
        setMensagem("Erro ao cadastrar campeonato.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function excluirCampeonato(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este campeonato?"
    );

    if (!confirmou) return;

    const campeonato = campeonatos.find(
      (item) => item.id === id
    );

    if (campeonato?.logo_url) {
      const marcador =
        "/storage/v1/object/public/campeonatos/";

      const posicao =
        campeonato.logo_url.indexOf(marcador);

      if (posicao !== -1) {
        const caminho =
          campeonato.logo_url.substring(
            posicao + marcador.length
          );

        await supabase.storage
          .from("campeonatos")
          .remove([caminho]);
      }
    }

    const { error } = await supabase
      .from("campeonatos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensagem(`Erro ao excluir: ${error.message}`);
      return;
    }

    setMensagem("Campeonato excluído com sucesso.");

    await carregarCampeonatos();
  }

  return (
    <main className="min-h-screen bg-[#07140B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#34C759]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Campeonatos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            Cadastre e gerencie os campeonatos disponíveis na plataforma.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-[#0D1F12] p-5 sm:p-6">
            <h2 className="text-xl font-bold">
              Novo campeonato
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Nome
                </label>

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Copa FJU 2026"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Temporada
                  </label>

                  <input
                    value={temporada}
                    onChange={(e) => setTemporada(e.target.value)}
                    placeholder="Ex: 2026"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Ano
                  </label>

                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição do campeonato"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#34C759]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#17351D] px-4 py-3 outline-none focus:border-[#34C759]"
                >
                  <option value="ativo">
                    Ativo
                  </option>

                  <option value="em_andamento">
                    Em andamento
                  </option>

                  <option value="finalizado">
                    Finalizado
                  </option>

                  <option value="inativo">
                    Inativo
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Logo do campeonato
                </label>

                <label className="flex min-h-36 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center hover:bg-white/[0.06]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={selecionarLogo}
                    className="hidden"
                  />

                  {previewLogo ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={previewLogo}
                        alt="Prévia da logo"
                        className="h-24 w-24 object-contain"
                      />

                      <span className="mt-3 text-sm text-white/50">
                        Clique para trocar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">
                        Selecionar logo
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
                onClick={cadastrarCampeonato}
                disabled={carregando}
                className="w-full rounded-xl bg-[#00A500] px-4 py-3 font-black text-white transition hover:bg-[#14B814] disabled:opacity-50"
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar campeonato"}
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
                Campeonatos cadastrados
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {campeonatos.length} campeonato(s)
              </p>
            </div>

            {campeonatos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhum campeonato cadastrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {campeonatos.map((campeonato) => (
                  <article
                    key={campeonato.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex h-28 items-center justify-center rounded-2xl bg-white/5 p-3">
                      {campeonato.logo_url ? (
                        <img
                          src={campeonato.logo_url}
                          alt={campeonato.nome}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white/30">
                          Sem logo
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-black">
                      {campeonato.nome}
                    </h3>

                    <p className="mt-1 text-sm text-white/45">
                      {campeonato.ano || campeonato.temporada || "Sem temporada"}
                    </p>

                    {campeonato.descricao && (
                      <p className="mt-3 line-clamp-3 text-sm text-white/45">
                        {campeonato.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#00A500]/15 px-3 py-1 text-xs font-bold text-[#34C759]">
                        {campeonato.status || "ativo"}
                      </span>

                      <button
                        type="button"
                        onClick={() => excluirCampeonato(campeonato.id)}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20"
                      >
                        Excluir
                      </button>
                    </div>
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