"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type {
  ElementType,
  ReactNode,
} from "react";

import {
  Activity,
  BarChart3,
  CalendarDays,
  Home,
  LockKeyhole,
  Menu,
  Settings,
  Shield,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: ElementType;
};

/*
 * ============================================================
 * MENU PÚBLICO
 * ============================================================
 */

const menuPublico: MenuItem[] = [
  {
    label: "Início",
    href: "/",
    icon: Home,
  },
  {
    label: "Campeonatos",
    href: "/campeonatos",
    icon: Trophy,
  },
  {
    label: "Times",
    href: "/times",
    icon: Shield,
  },
  {
    label: "Jogadores",
    href: "/jogadores",
    icon: Users,
  },
  {
    label: "Jogos",
    href: "/jogos",
    icon: CalendarDays,
  },
  {
    label: "Eventos",
    href: "/eventos",
    icon: Activity,
  },
  {
    label: "Classificação",
    href: "/classificacao",
    icon: BarChart3,
  },
  {
    label: "Artilharia",
    href: "/artilharia",
    icon: Trophy,
  },
];

/*
 * ============================================================
 * MENU ADMINISTRATIVO
 * ============================================================
 */

const menuAdmin: MenuItem[] = [
  {
    label: "Campeonatos",
    href: "/admin/campeonatos",
    icon: Trophy,
  },
  {
    label: "Times",
    href: "/admin/times",
    icon: Shield,
  },
  {
    label: "Jogadores",
    href: "/admin/jogadores",
    icon: Users,
  },
  {
    label: "Jogos",
    href: "/admin/jogos",
    icon: CalendarDays,
  },
  {
    label: "Eventos",
    href: "/admin/eventos",
    icon: Activity,
  },
];

export default function SiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [menuAberto, setMenuAberto] =
    useState(false);

  const emAreaAdmin =
    pathname.startsWith("/admin");

  /*
   * ============================================================
   * LINK ATIVO
   * ============================================================
   */

  function estaAtivo(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    /*
     * Evita marcar /campeonatos como ativo
     * quando estamos em /admin/campeonatos
     */

    if (
      href === "/campeonatos"
    ) {
      return (
        pathname ===
          "/campeonatos" ||
        pathname.startsWith(
          "/campeonatos/"
        )
      );
    }

    return pathname.startsWith(
      href
    );
  }

  return (
    <div className="min-h-screen bg-[#030604] text-white">

      {/* ===================================================== */}
      {/* SIDEBAR DESKTOP */}
      {/* ===================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/[0.08] bg-[#050805] lg:flex">

        {/* LOGO */}

        <div className="flex h-[190px] flex-col items-center justify-center border-b border-white/[0.06] px-6">

          <Link
            href="/"
            className="flex flex-col items-center"
          >
            <div className="relative h-[115px] w-[145px]">
              <Image
                src="/fju-esportes.png"
                alt="FJU Esportes"
                fill
                priority
                className="object-contain"
              />
            </div>

            <p className="mt-1 text-lg font-black">
              FJU{" "}
              <span className="text-[#18C929]">
                ESPORTES
              </span>
            </p>
          </Link>
        </div>

        {/* NAVEGAÇÃO */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">

          {/* ÁREA PÚBLICA */}

          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
            Acompanhar
          </p>

          <div className="space-y-1.5">
            {menuPublico.map(
              (item) => {
                const Icon =
                  item.icon;

                const ativo =
                  estaAtivo(
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      ativo
                        ? "bg-gradient-to-r from-[#087A10] to-[#10A81B] text-white shadow-[0_0_25px_rgba(16,168,27,0.12)]"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={
                        1.8
                      }
                    />

                    <span>
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              }
            )}
          </div>

          {/* DIVISOR */}

          <div className="my-6 border-t border-white/[0.07]" />

          {/* ADMINISTRAÇÃO */}

          <div className="mb-3 flex items-center justify-between px-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
              Administração
            </p>

            <LockKeyhole
              size={13}
              className="text-[#18C929]/50"
            />
          </div>

          <div className="space-y-1.5">
            {menuAdmin.map(
              (item) => {
                const Icon =
                  item.icon;

                const ativo =
                  estaAtivo(
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      ativo
                        ? "bg-[#18C929]/10 text-[#18C929]"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={
                        1.8
                      }
                    />

                    <span>
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              }
            )}
          </div>

          {/* FUTURO */}

          <div className="my-6 border-t border-white/[0.07]" />

          <div className="space-y-1">

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/25">
              <UserRound
                size={18}
              />

              Usuários
            </div>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/25">
              <Settings
                size={18}
              />

              Configurações
            </div>
          </div>
        </nav>

        {/* IDENTIFICAÇÃO */}

        <div className="border-t border-white/[0.07] p-4">

          <div
            className={`rounded-2xl border p-4 ${
              emAreaAdmin
                ? "border-[#18C929]/15 bg-[#18C929]/5"
                : "border-white/[0.07] bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E2B12] text-[#18C929]">
                <UserRound
                  size={20}
                />
              </div>

              <div>
                <p className="text-sm font-bold">
                  {emAreaAdmin
                    ? "Administração"
                    : "FJU Esportes"}
                </p>

                <p className="text-xs text-white/35">
                  {emAreaAdmin
                    ? "Painel de gestão"
                    : "Campeonatos"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================================================== */}
      {/* HEADER MOBILE */}
      {/* ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-30 flex h-[70px] items-center justify-between border-b border-white/[0.08] bg-[#050805]/95 px-4 backdrop-blur lg:hidden">

        <button
          type="button"
          onClick={() =>
            setMenuAberto(true)
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/">
          <div className="relative h-[52px] w-[90px]">
            <Image
              src="/fju-esportes.png"
              alt="FJU Esportes"
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>

        <div
          className={`flex h-9 min-w-[48px] items-center justify-center rounded-full px-3 text-[10px] font-black uppercase ${
            emAreaAdmin
              ? "bg-[#18C929]/10 text-[#18C929]"
              : "text-white/25"
          }`}
        >
          {emAreaAdmin
            ? "Admin"
            : ""}
        </div>
      </header>

      {/* ===================================================== */}
      {/* MENU MOBILE */}
      {/* ===================================================== */}

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* FUNDO */}

          <button
            type="button"
            onClick={() =>
              setMenuAberto(
                false
              )
            }
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Fechar menu"
          />

          {/* DRAWER */}

          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] overflow-y-auto border-r border-white/10 bg-[#050805] p-4 shadow-2xl">

            {/* CABEÇALHO */}

            <div className="flex items-center justify-between">

              <Link
                href="/"
                onClick={() =>
                  setMenuAberto(
                    false
                  )
                }
              >
                <div className="relative h-[85px] w-[125px]">
                  <Image
                    src="/fju-esportes.png"
                    alt="FJU Esportes"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMenuAberto(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"
                aria-label="Fechar menu"
              >
                <X size={21} />
              </button>
            </div>

            {/* PÚBLICO */}

            <p className="mb-3 mt-6 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
              Acompanhar
            </p>

            <nav className="space-y-1.5">

              {menuPublico.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const ativo =
                    estaAtivo(
                      item.href
                    );

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setMenuAberto(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                        ativo
                          ? "bg-[#0A9815] text-white"
                          : "text-white/60 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        size={19}
                      />

                      {
                        item.label
                      }
                    </Link>
                  );
                }
              )}
            </nav>

            <div className="my-6 border-t border-white/[0.07]" />

            {/* ADMIN */}

            <div className="mb-3 flex items-center justify-between px-4">

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
                Administração
              </p>

              <LockKeyhole
                size={13}
                className="text-[#18C929]/50"
              />
            </div>

            <nav className="space-y-1.5">

              {menuAdmin.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const ativo =
                    estaAtivo(
                      item.href
                    );

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setMenuAberto(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                        ativo
                          ? "bg-[#18C929]/10 text-[#18C929]"
                          : "text-white/45 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        size={19}
                      />

                      {
                        item.label
                      }
                    </Link>
                  );
                }
              )}
            </nav>

            <div className="my-6 border-t border-white/[0.07]" />

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E2B12] text-[#18C929]">
                  <UserRound
                    size={20}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    FJU Esportes
                  </p>

                  <p className="text-xs text-white/35">
                    Plataforma de campeonatos
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ===================================================== */}
      {/* CONTEÚDO */}
      {/* ===================================================== */}

      <div className="min-h-screen lg:pl-[260px]">

        <main className="min-h-screen pb-[82px] pt-[70px] lg:pb-0 lg:pt-0">
          {children}
        </main>
      </div>

      {/* ===================================================== */}
      {/* NAVEGAÇÃO INFERIOR MOBILE */}
      {/* ===================================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[72px] grid-cols-4 border-t border-white/[0.08] bg-[#050805]/95 px-2 backdrop-blur lg:hidden">

        <BottomItem
          href="/"
          label="Início"
          icon={Home}
          ativo={
            pathname === "/"
          }
        />

        <BottomItem
          href="/campeonatos"
          label="Campeonatos"
          icon={Trophy}
          ativo={
            pathname ===
              "/campeonatos" ||
            pathname.startsWith(
              "/campeonatos/"
            )
          }
        />

        <BottomItem
          href="/classificacao"
          label="Tabela"
          icon={BarChart3}
          ativo={
            pathname.startsWith(
              "/classificacao"
            )
          }
        />

        <BottomItem
          href="/admin/campeonatos"
          label="Admin"
          icon={LockKeyhole}
          ativo={
            pathname.startsWith(
              "/admin"
            )
          }
        />
      </nav>
    </div>
  );
}

/*
 * ============================================================
 * ITEM DA NAVEGAÇÃO MOBILE
 * ============================================================
 */

function BottomItem({
  href,
  label,
  icon: Icon,
  ativo,
}: {
  href: string;
  label: string;
  icon: ElementType;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
        ativo
          ? "text-[#18C929]"
          : "text-white/35"
      }`}
    >
      <Icon
        size={21}
        strokeWidth={1.8}
      />

      <span>
        {label}
      </span>
    </Link>
  );
}