"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  ano: number | null;
  temporada: string | null;
  status: string | null;
};

type Time = {
  id: number;
  campeonato_id: number | null;
};

type Jogador = {
  id: number;
  time_id: number | null;
};

type Jogo = {
  id: number;
  campeonato_id: number | null;
  status: string | null;
  data_jogo: string | null;
};

export default function AdminPage() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      campeonatosResponse,
      timesResponse,
      jogadoresResponse,
      jogosResponse,
    ] = await Promise.all([
      supabase
        .from("campeonatos")
        .select("id, nome, ano, temporada, status")
        .order("ano", { ascending: false })
        .order("nome", { ascending: true }),

      supabase
        .from("times")
        .select("id, campeonato_id"),

      supabase
        .from("jogadores")
        .select("id, time_id"),

      supabase
        .from("jogos")
        .select("id, campeonato_id, status, data_jogo")
        .order("data_jogo", { ascending: false }),
    ]);

    if (campeonatosResponse.error) {
      setErro(
        `Erro ao carregar campeonatos: ${campeonatosResponse.error.message}`
      );
      setCarregando(false);
      return;
    }

    if (timesResponse.error) {
      setErro(
        `Erro ao carregar times: ${timesResponse.error.message}`
      );
      setCarregando(false);
      return;
    }

    if (jogadoresResponse.error) {
      setErro(
        `Erro ao carregar jogadores: ${jogadoresResponse.error.message}`
      );
      setCarregando(false);
      return;
    }

    if (jogosResponse.error) {
      setErro(
        `Erro ao carregar jogos: ${jogosResponse.error.message}`
      );
      setCarregando(false);
      return;
    }

    setCampeonatos(campeonatosResponse.data ?? []);
    setTimes(timesResponse.data ?? []);
    setJogadores(jogadoresResponse.data ?? []);
    setJogos(jogosResponse.data ?? []);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const campeonatosAtivos = useMemo(() => {
    return campeonatos.filter(
      (campeonato) => campeonato.status === "ativo"
    ).length;
  }, [campeonatos]);

  const jogosPendentes = useMemo(() => {
    return jogos.filter(
      (jogo) =>
        jogo.status !== "finalizado" &&
        jogo.status !== "cancelado"
    ).length;
  }, [jogos]);

  const jogosFinalizados = useMemo(() => {
    return jogos.filter(
      (jogo) => jogo.status === "finalizado"
    ).length;
  }, [jogos]);

  const ultimosCampeonatos = useMemo(() => {
    return campeonatos.slice(0, 5);
  }, [campeonatos]);

  if (carregando) {
    return (
      <main className="min-h-screen p-6 text-white">
        <div className="rounded-3xl border border-white/[0.08] bg-[#080D09] p-12 text-center text-white/40">
          Carregando administração...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        <header className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18C929]">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Painel de gestão
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Gerencie campeonatos, equipes, jogadores, partidas e eventos.
          </p>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumo
            titulo="Campeonatos ativos"
            valor={campeonatosAtivos}
            icon={Trophy}
          />

          <Resumo
            titulo="Times"
            valor={times.length}
            icon={Shield}
          />

          <Resumo
            titulo="Jogadores"
            valor={jogadores.length}
            icon={Users}
          />

          <Resumo
            titulo="Jogos pendentes"
            valor={jogosPendentes}
            icon={CalendarDays}
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">

          <section className="rounded-[24px] border border-white/[0.08] bg-[#080D09] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black">
                Ações rápidas
              </h2>

              <p className="mt-1 text-sm text-white/35">
                Acesse as principais áreas de gestão.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Acao
                titulo="Campeonatos"
                descricao="Criar e editar campeonatos"
                href="/admin/campeonatos"
                icon={Trophy}
              />

              <Acao
                titulo="Times"
                descricao="Cadastrar equipes"
                href="/admin/times"
                icon={Shield}
              />

              <Acao
                titulo="Jogadores"
                descricao="Gerenciar elencos"
                href="/admin/jogadores"
                icon={UserPlus}
              />

              <Acao
                titulo="Jogos"
                descricao="Criar partidas e resultados"
                href="/admin/jogos"
                icon={CalendarDays}
              />

              <Acao
                titulo="Eventos"
                descricao="Gols, assistências e cartões"
                href="/admin/eventos"
                icon={Activity}
              />

              <Acao
                titulo="Visualização pública"
                descricao="Abrir área do torcedor"
                href="/campeonatos"
                icon={ChevronRight}
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[0.08] bg-[#080D09] p-5 sm:p-6">
            <h2 className="text-xl font-black">
              Situação dos jogos
            </h2>

            <div className="mt-5 space-y-3">
              <Situacao
                titulo="Pendentes"
                valor={jogosPendentes}
                descricao="Aguardando ou em andamento"
              />

              <Situacao
                titulo="Finalizados"
                valor={jogosFinalizados}
                descricao="Com resultado lançado"
              />

              <Situacao
                titulo="Total"
                valor={jogos.length}
                descricao="Partidas cadastradas"
              />
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[24px] border border-white/[0.08] bg-[#080D09] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Campeonatos recentes
                </h2>

                <p className="mt-1 text-sm text-white/35">
                  Últimos campeonatos cadastrados.
                </p>
              </div>

              <Link
                href="/admin/campeonatos"
                className="text-xs font-bold text-[#18C929]"
              >
                Ver todos
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {ultimosCampeonatos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/35">
                  Nenhum campeonato cadastrado.
                </div>
              ) : (
                ultimosCampeonatos.map((campeonato) => (
                  <Link
                    key={campeonato.id}
                    href={`/campeonatos/${campeonato.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-[#18C929]/20"
                  >
                    <div>
                      <p className="font-bold">
                        {campeonato.nome}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {campeonato.ano ??
                          campeonato.temporada ??
                          "Sem temporada"}
                      </p>
                    </div>

                    <span className="rounded-lg bg-[#18C929]/10 px-2.5 py-1 text-[10px] font-black uppercase text-[#18C929]">
                      {campeonato.status || "ativo"}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#18C929]/15 bg-[#071208] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
                <CircleAlert size={21} />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Próxima etapa
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  Depois deste painel, vamos criar o login administrativo
                  e bloquear as rotas <strong className="text-white/70">/admin</strong>{" "}
                  para quem não estiver autenticado.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Resumo({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  icon: typeof Trophy;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#080D09] p-4 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
        <Icon size={20} />
      </div>

      <p className="mt-4 text-3xl font-black">
        {valor}
      </p>

      <p className="mt-1 text-xs font-bold text-white/45 sm:text-sm">
        {titulo}
      </p>
    </div>
  );
}

function Acao({
  titulo,
  descricao,
  href,
  icon: Icon,
}: {
  titulo: string;
  descricao: string;
  href: string;
  icon: typeof Trophy;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-[#18C929]/25"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18C929]/10 text-[#18C929]">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black">
          {titulo}
        </p>

        <p className="mt-1 text-xs text-white/35">
          {descricao}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="text-white/20 transition group-hover:text-[#18C929]"
      />
    </Link>
  );
}

function Situacao({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: number;
  descricao: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div>
        <p className="font-bold">
          {titulo}
        </p>

        <p className="mt-1 text-xs text-white/35">
          {descricao}
        </p>
      </div>

      <strong className="text-2xl font-black text-[#18C929]">
        {valor}
      </strong>
    </div>
  );
}
