"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { ChevronRight, Plus, Trophy, Trash2 } from "lucide-react";

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
      console.error("ERRO STORAGE:", error);

      throw new Error(
        `Falha ao enviar logo: ${error.message}`
      );
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
  setMensagem("");

  const campeonato = campeonatos.find(
    (item) => item.id === id
  );

  if (!campeonato) {
    setMensagem("Campeonato não encontrado.");
    return;
  }

  // Primeiro verifica se existem jogos vinculados.
  const { count, error: jogosError } = await supabase
    .from("jogos")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("campeonato_id", id);

  if (jogosError) {
    console.error(
      "Erro ao verificar jogos do campeonato:",
      jogosError
    );

    setMensagem(
      `Erro ao verificar campeonato: ${jogosError.message}`
    );

    return;
  }

  const totalJogos = count ?? 0;

  if (totalJogos > 0) {
    setMensagem(
      `Não é possível excluir "${campeonato.nome}" porque existem ${totalJogos} jogo(s) vinculado(s) a este campeonato. Exclua ou mova os jogos primeiro.`
    );

    return;
  }

  const confirmou = window.confirm(
    `Tem certeza que deseja excluir o campeonato "${campeonato.nome}"?`
  );

  if (!confirmou) {
    return;
  }

  // Primeiro excluímos o registro do banco.
  const { error: excluirError } = await supabase
    .from("campeonatos")
    .delete()
    .eq("id", id);

  if (excluirError) {
    console.error(
      "Erro ao excluir campeonato:",
      excluirError
    );

    setMensagem(
      `Erro ao excluir campeonato: ${excluirError.message}`
    );

    return;
  }

  // Só depois de excluir o campeonato com sucesso
  // tentamos remover a logo do Storage.
  if (campeonato.logo_url) {
    const marcador =
      "/storage/v1/object/public/campeonatos/";

    const posicao =
      campeonato.logo_url.indexOf(marcador);

    if (posicao !== -1) {
      const caminho =
        campeonato.logo_url.substring(
          posicao + marcador.length
        );

      const { error: storageError } =
        await supabase.storage
          .from("campeonatos")
          .remove([caminho]);

      if (storageError) {
        console.error(
          "Campeonato excluído, mas houve erro ao remover a logo:",
          storageError
        );
      }
    }
  }

  setMensagem(
    `"${campeonato.nome}" excluído com sucesso.`
  );

  await carregarCampeonatos();
}

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18C929]">
            FJU Esportes
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Campeonatos
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Cadastre, gerencie e abra os campeonatos da plataforma.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                <Plus size={20} />
              </div>

              <h2 className="text-xl font-black">
                Novo campeonato
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Nome
                </label>

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Taça BH"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#18C929]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Temporada
                  </label>

                  <input
                    value={temporada}
                    onChange={(e) => setTemporada(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#18C929]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Ano
                  </label>

                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#18C929]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  placeholder="Descrição do campeonato"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#18C929]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101912] px-4 py-3 outline-none focus:border-[#18C929]"
                >
                  <option value="ativo">Ativo</option>
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
                <label className="mb-2 block text-sm text-white/55">
                  Logo
                </label>

                <label className="flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center transition hover:border-[#18C929]/30">
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

                      <span className="mt-3 text-xs text-white/40">
                        Clique para trocar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Trophy
                        size={30}
                        className="mx-auto text-[#18C929]"
                      />

                      <p className="mt-3 font-bold">
                        Selecionar logo
                      </p>

                      <p className="mt-1 text-xs text-white/30">
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
                className="w-full rounded-xl bg-[#18C929] px-4 py-3 font-black text-black transition hover:bg-[#2DDF3B] disabled:opacity-50"
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar campeonato"}
              </button>

              {mensagem && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-sm text-white/65">
                  {mensagem}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                Campeonatos cadastrados
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {campeonatos.length} campeonato(s)
              </p>
            </div>

            {campeonatos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center text-white/30">
                Nenhum campeonato cadastrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {campeonatos.map((campeonato) => (
                  <article
                    key={campeonato.id}
                    className="group rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-[#18C929]/20"
                  >
                    <div className="flex h-32 items-center justify-center rounded-2xl bg-black/20 p-3">
                      {campeonato.logo_url ? (
                        <img
                          src={campeonato.logo_url}
                          alt={campeonato.nome}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Trophy
                          size={40}
                          className="text-[#18C929]/60"
                        />
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black">
                            {campeonato.nome}
                          </h3>

                          <p className="mt-1 text-xs text-white/35">
                            {campeonato.ano ||
                              campeonato.temporada ||
                              "Sem temporada"}
                          </p>
                        </div>

                        <span className="rounded-full bg-[#18C929]/10 px-2.5 py-1 text-[10px] font-black uppercase text-[#18C929]">
                          {campeonato.status || "ativo"}
                        </span>
                      </div>

                      {campeonato.descricao && (
                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/40">
                          {campeonato.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 space-y-2">
                      <Link
                        href={`/campeonatos/${campeonato.id}`}
                        className="flex w-full items-center justify-between rounded-xl bg-[#18C929]/10 px-4 py-3 text-sm font-black text-[#18C929] transition hover:bg-[#18C929]/15"
                      >
                        Abrir campeonato
                        <ChevronRight size={17} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          excluirCampeonato(campeonato.id)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.07] px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
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