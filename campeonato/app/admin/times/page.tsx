"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  cidade: string | null;
  escudo_url: string | null;
};

export default function AdminTimesPage() {
  const [times, setTimes] = useState<Time[]>([]);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [cidade, setCidade] = useState("");
  const [escudo, setEscudo] = useState<File | null>(null);
  const [previewEscudo, setPreviewEscudo] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarTimes() {
    const { data, error } = await supabase
      .from("times")
      .select("id, nome, sigla, cidade, escudo_url")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar times:", error);
      setMensagem(`Erro ao carregar times: ${error.message}`);
      return;
    }

    setTimes(data ?? []);
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  function selecionarEscudo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      setEscudo(null);
      setPreviewEscudo(null);
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setMensagem("Selecione um arquivo de imagem.");
      return;
    }

    const limite = 5 * 1024 * 1024;

    if (arquivo.size > limite) {
      setMensagem("O escudo deve ter no máximo 5 MB.");
      return;
    }

    setEscudo(arquivo);
    setMensagem("");

    const url = URL.createObjectURL(arquivo);
    setPreviewEscudo(url);
  }

  async function enviarEscudo() {
    if (!escudo) {
      return null;
    }

    const extensao =
      escudo.name.split(".").pop()?.toLowerCase() || "png";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("escudos")
      .upload(nomeArquivo, escudo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("escudos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function cadastrarTime() {
    setMensagem("");

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

      const { error } = await supabase.from("times").insert([
        {
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
      setPreviewEscudo(null);

      setMensagem("Time cadastrado com sucesso.");

      await carregarTimes();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMensagem(`Erro ao cadastrar: ${error.message}`);
      } else {
        setMensagem("Erro ao cadastrar o time.");
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
      const marcador = "/storage/v1/object/public/escudos/";
      const posicao = time.escudo_url.indexOf(marcador);

      if (posicao !== -1) {
        const caminho = time.escudo_url.substring(
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

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Times
          </h1>

          <p className="mt-2 text-white/50">
            Cadastre e gerencie os times do campeonato.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
            <h2 className="text-xl font-bold">
              Cadastrar time
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Nome do time
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Alcance FC"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
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
                    setSigla(e.target.value.toUpperCase())
                  }
                  maxLength={5}
                  placeholder="Ex: AFC"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Cidade
                </label>

                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Belo Horizonte"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Escudo
                </label>

                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center transition hover:bg-white/[0.06]">
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
                className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#07111f] transition hover:bg-emerald-300 disabled:opacity-50"
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

          <section className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Times cadastrados
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {times.length} time(s)
              </p>
            </div>

            {times.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
                Nenhum time cadastrado.
              </div>
            ) : (
              <div className="space-y-3">
                {times.map((time) => (
                  <div
                    key={time.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-4">
                      {time.escudo_url ? (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2">
                          <img
                            src={time.escudo_url}
                            alt={time.nome}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 font-bold text-white/60">
                          {time.sigla?.slice(0, 2) || "FC"}
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold">
                          {time.nome}
                        </h3>

                        <p className="text-sm text-white/45">
                          {time.sigla || "Sem sigla"}
                          {time.cidade
                            ? ` • ${time.cidade}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirTime(time.id)}
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
      </div>
    </main>
  );
}