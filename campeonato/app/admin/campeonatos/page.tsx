"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import {
  ChevronRight,
  Pencil,
  Plus,
  Trophy,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
  descricao: string | null;
  logo_url: string | null;
  status: string | null;
  formato: "pontos_corridos" | "mata_mata";
  tipo_confronto: "jogo_unico" | "ida_volta";
  permite_wo: boolean;
};

const FORMATOS = [
  {
    value: "pontos_corridos",
    label: "Pontos corridos",
  },
  {
    value: "mata_mata",
    label: "Mata-mata",
  },
];

const TIPOS_CONFRONTO = [
  {
    value: "jogo_unico",
    label: "Jogo único",
  },
  {
    value: "ida_volta",
    label: "Ida e volta",
  },
];

export default function AdminCampeonatosPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [nome, setNome] = useState("");
  const [temporada, setTemporada] = useState("");
  const [ano, setAno] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("ativo");

  const [formato, setFormato] =
    useState<"pontos_corridos" | "mata_mata">(
      "pontos_corridos"
    );

  const [tipoConfronto, setTipoConfronto] =
    useState<"jogo_unico" | "ida_volta">(
      "jogo_unico"
    );

  const [permiteWo, setPermiteWo] =
    useState(true);

  const [logo, setLogo] =
    useState<File | null>(null);

  const [previewLogo, setPreviewLogo] =
    useState<string | null>(null);

  const [logoAtual, setLogoAtual] =
    useState<string | null>(null);

  const [
    campeonatoEditandoId,
    setCampeonatoEditandoId,
  ] = useState<number | null>(null);

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
        ano,
        descricao,
        logo_url,
        status,
        formato,
        tipo_confronto,
        permite_wo
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

  useEffect(() => {
    carregarCampeonatos();
  }, []);

  function revogarPreviewLocal() {
    if (
      previewLogo &&
      previewLogo.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        previewLogo
      );
    }
  }

  function selecionarLogo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (
      !arquivo.type.startsWith(
        "image/"
      )
    ) {
      setMensagem(
        "Selecione uma imagem válida."
      );

      return;
    }

    if (
      arquivo.size >
      5 * 1024 * 1024
    ) {
      setMensagem(
        "A logo deve ter no máximo 5 MB."
      );

      return;
    }

    revogarPreviewLocal();

    setLogo(arquivo);

    setPreviewLogo(
      URL.createObjectURL(
        arquivo
      )
    );

    setMensagem("");
  }

  async function enviarLogo() {
    if (!logo) {
      return null;
    }

    const extensao =
      logo.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "png";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } =
      await supabase.storage
        .from("campeonatos")
        .upload(
          nomeArquivo,
          logo,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (error) {
      throw new Error(
        `Falha ao enviar logo: ${error.message}`
      );
    }

    const { data } =
      supabase.storage
        .from("campeonatos")
        .getPublicUrl(
          nomeArquivo
        );

    return data.publicUrl;
  }

  async function excluirLogoStorage(
    url: string | null
  ) {
    if (!url) {
      return;
    }

    const marcador =
      "/storage/v1/object/public/campeonatos/";

    const posicao =
      url.indexOf(
        marcador
      );

    if (
      posicao === -1
    ) {
      return;
    }

    const caminho =
      url.substring(
        posicao +
          marcador.length
      );

    const { error } =
      await supabase.storage
        .from("campeonatos")
        .remove([
          caminho,
        ]);

    if (error) {
      console.error(
        "Erro ao remover logo:",
        error
      );
    }
  }

  function limparFormulario() {
    revogarPreviewLocal();

    setNome("");
    setTemporada("");
    setAno("");
    setDescricao("");
    setStatus("ativo");

    setFormato(
      "pontos_corridos"
    );

    setTipoConfronto(
      "jogo_unico"
    );

    setPermiteWo(true);

    setLogo(null);
    setPreviewLogo(null);
    setLogoAtual(null);

    setCampeonatoEditandoId(
      null
    );
  }

  async function salvarCampeonato() {
    setMensagem("");

    if (!nome.trim()) {
      setMensagem(
        "Informe o nome do campeonato."
      );

      return;
    }

    setCarregando(true);

    try {
      let novaLogoUrl:
        | string
        | null = null;

      if (logo) {
        novaLogoUrl =
          await enviarLogo();
      }

      if (
        campeonatoEditandoId !==
        null
      ) {
        const dados = {
          nome:
            nome.trim(),

          temporada:
            temporada.trim() ||
            null,

          ano:
            ano
              ? Number(ano)
              : null,

          descricao:
            descricao.trim() ||
            null,

          status,
          formato,

          tipo_confronto:
            tipoConfronto,

          permite_wo:
            permiteWo,

          ...(novaLogoUrl
            ? {
                logo_url:
                  novaLogoUrl,
              }
            : {}),
        };

        const { error } =
          await supabase
            .from(
              "campeonatos"
            )
            .update(
              dados
            )
            .eq(
              "id",
              campeonatoEditandoId
            );

        if (error) {
          if (
            novaLogoUrl
          ) {
            await excluirLogoStorage(
              novaLogoUrl
            );
          }

          throw new Error(
            error.message
          );
        }

        if (
          novaLogoUrl &&
          logoAtual &&
          novaLogoUrl !==
            logoAtual
        ) {
          await excluirLogoStorage(
            logoAtual
          );
        }

        setMensagem(
          "Campeonato atualizado com sucesso."
        );
      } else {
        const { error } =
          await supabase
            .from(
              "campeonatos"
            )
            .insert([
              {
                nome:
                  nome.trim(),

                temporada:
                  temporada.trim() ||
                  null,

                ano:
                  ano
                    ? Number(ano)
                    : null,

                descricao:
                  descricao.trim() ||
                  null,

                logo_url:
                  novaLogoUrl,

                status,
                formato,

                tipo_confronto:
                  tipoConfronto,

                permite_wo:
                  permiteWo,
              },
            ]);

        if (error) {
          if (
            novaLogoUrl
          ) {
            await excluirLogoStorage(
              novaLogoUrl
            );
          }

          throw new Error(
            error.message
          );
        }

        setMensagem(
          "Campeonato cadastrado com sucesso."
        );
      }

      limparFormulario();

      await carregarCampeonatos();
    } catch (error) {
      console.error(error);

      if (
        error instanceof
        Error
      ) {
        setMensagem(
          `Erro ao salvar: ${error.message}`
        );
      } else {
        setMensagem(
          "Erro ao salvar campeonato."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  function editarCampeonato(
    campeonato: Campeonato
  ) {
    revogarPreviewLocal();

    setCampeonatoEditandoId(
      campeonato.id
    );

    setNome(
      campeonato.nome
    );

    setTemporada(
      campeonato.temporada ??
        ""
    );

    setAno(
      campeonato.ano
        ? String(
            campeonato.ano
          )
        : ""
    );

    setDescricao(
      campeonato.descricao ??
        ""
    );

    setStatus(
      campeonato.status ??
        "ativo"
    );

    setFormato(
      campeonato.formato ??
        "pontos_corridos"
    );

    setTipoConfronto(
      campeonato.tipo_confronto ??
        "jogo_unico"
    );

    setPermiteWo(
      campeonato.permite_wo ??
        true
    );

    setLogo(null);

    setLogoAtual(
      campeonato.logo_url
    );

    setPreviewLogo(
      campeonato.logo_url
    );

    setMensagem(
      `Editando "${campeonato.nome}".`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    limparFormulario();

    setMensagem(
      "Edição cancelada."
    );
  }

  async function excluirCampeonato(
    id: number
  ) {
    setMensagem("");

    const campeonato =
      campeonatos.find(
        (item) =>
          item.id === id
      );

    if (!campeonato) {
      setMensagem(
        "Campeonato não encontrado."
      );

      return;
    }

    const confirmou =
      window.confirm(
        `Tem certeza que deseja excluir "${campeonato.nome}"?

Os times e jogos serão mantidos.`
      );

    if (!confirmou) {
      return;
    }

    setCarregando(true);

    try {
      const { error } =
        await supabase
          .from(
            "campeonatos"
          )
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      await excluirLogoStorage(
        campeonato.logo_url
      );

      if (
        campeonatoEditandoId ===
        id
      ) {
        limparFormulario();
      }

      setMensagem(
        `"${campeonato.nome}" excluído com sucesso.`
      );

      await carregarCampeonatos();
    } catch (error) {
      console.error(error);

      if (
        error instanceof
        Error
      ) {
        setMensagem(
          `Erro ao excluir: ${error.message}`
        );
      } else {
        setMensagem(
          "Erro ao excluir campeonato."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  function nomeFormato(
    valor: Campeonato["formato"]
  ) {
    return (
      FORMATOS.find(
        (item) =>
          item.value === valor
      )?.label ??
      valor
    );
  }

  function nomeTipoConfronto(
    valor: Campeonato["tipo_confronto"]
  ) {
    return (
      TIPOS_CONFRONTO.find(
        (item) =>
          item.value === valor
      )?.label ??
      valor
    );
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
            Cadastre, edite e configure as regras dos campeonatos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">

          <section className="rounded-[24px] border border-white/[0.07] bg-[#080D09] p-5 sm:p-6">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                  {campeonatoEditandoId !==
                  null ? (
                    <Pencil
                      size={20}
                    />
                  ) : (
                    <Plus
                      size={20}
                    />
                  )}
                </div>

                <h2 className="text-xl font-black">
                  {campeonatoEditandoId !==
                  null
                    ? "Editar campeonato"
                    : "Novo campeonato"}
                </h2>

              </div>

              {campeonatoEditandoId !==
                null && (
                <button
                  type="button"
                  onClick={
                    cancelarEdicao
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  <X
                    size={17}
                  />
                </button>
              )}

            </div>

            <div className="mt-6 space-y-5">

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Nome
                </label>

                <input
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
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
                    value={
                      temporada
                    }
                    onChange={(e) =>
                      setTemporada(
                        e.target.value
                      )
                    }
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
                    onChange={(e) =>
                      setAno(
                        e.target.value
                      )
                    }
                    placeholder="2026"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#18C929]"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Formato
                </label>

                <select
                  value={formato}
                  onChange={(e) =>
                    setFormato(
                      e.target.value as
                        | "pontos_corridos"
                        | "mata_mata"
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101912] px-4 py-3 outline-none focus:border-[#18C929]"
                >
                  {FORMATOS.map(
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

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Tipo de confronto
                </label>

                <select
                  value={
                    tipoConfronto
                  }
                  onChange={(e) =>
                    setTipoConfronto(
                      e.target.value as
                        | "jogo_unico"
                        | "ida_volta"
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101912] px-4 py-3 outline-none focus:border-[#18C929]"
                >
                  {TIPOS_CONFRONTO.map(
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

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="font-bold">
                      Permitir WO
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Em mata-mata, um WO poderá eliminar o time imediatamente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPermiteWo(
                        (valor) =>
                          !valor
                      )
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      permiteWo
                        ? "bg-[#18C929]"
                        : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        permiteWo
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>

                </div>

                <p
                  className={`mt-3 text-xs font-black uppercase ${
                    permiteWo
                      ? "text-[#18C929]"
                      : "text-white/30"
                  }`}
                >
                  {permiteWo
                    ? "WO permitido"
                    : "WO desativado"}
                </p>

              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Descrição
                </label>

                <textarea
                  value={
                    descricao
                  }
                  onChange={(e) =>
                    setDescricao(
                      e.target.value
                    )
                  }
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
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101912] px-4 py-3 outline-none focus:border-[#18C929]"
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
                <label className="mb-2 block text-sm text-white/55">
                  Logo
                </label>

                <label className="flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center transition hover:border-[#18C929]/30">

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      selecionarLogo
                    }
                    className="hidden"
                  />

                  {previewLogo ? (
                    <div className="flex flex-col items-center">

                      <img
                        src={
                          previewLogo
                        }
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
                onClick={
                  salvarCampeonato
                }
                disabled={
                  carregando
                }
                className="w-full rounded-xl bg-[#18C929] px-4 py-3 font-black text-black transition hover:bg-[#2DDF3B] disabled:opacity-50"
              >
                {carregando
                  ? "Salvando..."
                  : campeonatoEditandoId !==
                      null
                    ? "Salvar alterações"
                    : "Cadastrar campeonato"}
              </button>

              {campeonatoEditandoId !==
                null && (
                <button
                  type="button"
                  onClick={
                    cancelarEdicao
                  }
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/55 transition hover:bg-white/5"
                >
                  Cancelar edição
                </button>
              )}

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

            {campeonatos.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center text-white/30">
                Nenhum campeonato cadastrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {campeonatos.map(
                  (campeonato) => (
                    <article
                      key={
                        campeonato.id
                      }
                      className="group rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-[#18C929]/20"
                    >

                      <div className="flex h-32 items-center justify-center rounded-2xl bg-black/20 p-3">

                        {campeonato.logo_url ? (
                          <img
                            src={
                              campeonato.logo_url
                            }
                            alt={
                              campeonato.nome
                            }
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
                            {campeonato.status ||
                              "ativo"}
                          </span>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-white/60">
                            {nomeFormato(
                              campeonato.formato
                            )}
                          </span>

                          <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-white/60">
                            {nomeTipoConfronto(
                              campeonato.tipo_confronto
                            )}
                          </span>

                          <span
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                              campeonato.permite_wo
                                ? "bg-[#18C929]/10 text-[#18C929]"
                                : "bg-white/[0.04] text-white/30"
                            }`}
                          >
                            {campeonato.permite_wo
                              ? "WO permitido"
                              : "Sem WO"}
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

                          <ChevronRight
                            size={17}
                          />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            editarCampeonato(
                              campeonato
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/[0.07]"
                        >
                          <Pencil
                            size={14}
                          />

                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluirCampeonato(
                              campeonato.id
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.07] px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                        >
                          <Trash2
                            size={14}
                          />

                          Excluir
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}