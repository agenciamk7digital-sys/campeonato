"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ElementType, ReactNode } from "react";

import {
  Activity,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
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

const menuPrincipal: MenuItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Campeonatos", href: "/admin/campeonatos", icon: Trophy },
  { label: "Times", href: "/admin/times", icon: Shield },
  { label: "Jogadores", href: "/admin/jogadores", icon: Users },
  { label: "Jogos", href: "/admin/jogos", icon: CalendarDays },
  { label: "Eventos", href: "/admin/eventos", icon: Activity },
  { label: "Classificação", href: "/classificacao", icon: BarChart3 },
  { label: "Artilharia", href: "/artilharia", icon: Trophy },
];

export default function SiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  function estaAtivo(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#030604] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-white/[0.08] bg-[#050805] lg:flex">
        <div className="flex h-[190px] flex-col items-center justify-center border-b border-white/[0.06] px-6">
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
            FJU <span className="text-[#18C929]">ESPORTES</span>
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1.5">
            {menuPrincipal.map((item) => {
              const Icon = item.icon;
              const ativo = estaAtivo(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    ativo
                      ? "bg-gradient-to-r from-[#087A10] to-[#10A81B] text-white shadow-[0_0_25px_rgba(16,168,27,0.12)]"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="my-6 border-t border-white/[0.07]" />

          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
            Administração
          </p>

          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/45">
              <UserRound size={18} />
              Usuários
            </div>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/45">
              <Settings size={18} />
              Configurações
            </div>
          </div>
        </nav>

        <div className="border-t border-white/[0.07] p-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E2B12] text-[#18C929]">
                <UserRound size={20} />
              </div>

              <div>
                <p className="text-sm font-bold">Administrador</p>
                <p className="text-xs text-white/35">FJU Esportes</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-[70px] items-center justify-between border-b border-white/[0.08] bg-[#050805]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
        >
          <Menu size={22} />
        </button>

        <div className="relative h-[52px] w-[90px]">
          <Image
            src="/fju-esportes.png"
            alt="FJU Esportes"
            fill
            className="object-contain"
          />
        </div>

        <div className="h-10 w-10" />
      </header>

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Fechar menu"
          />

          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] border-r border-white/10 bg-[#050805] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="relative h-[85px] w-[125px]">
                <Image
                  src="/fju-esportes.png"
                  alt="FJU Esportes"
                  fill
                  className="object-contain"
                />
              </div>

              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"
              >
                <X size={21} />
              </button>
            </div>

            <nav className="mt-6 space-y-1.5">
              {menuPrincipal.map((item) => {
                const Icon = item.icon;
                const ativo = estaAtivo(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                      ativo
                        ? "bg-[#0A9815] text-white"
                        : "text-white/60"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[250px]">
        <main className="min-h-screen pb-[82px] pt-[70px] lg:pb-0 lg:pt-0">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[72px] grid-cols-4 border-t border-white/[0.08] bg-[#050805]/95 px-2 backdrop-blur lg:hidden">
        <BottomItem
          href="/"
          label="Início"
          icon={LayoutDashboard}
          ativo={pathname === "/"}
        />

        <BottomItem
          href="/admin/times"
          label="Times"
          icon={Shield}
          ativo={pathname.startsWith("/admin/times")}
        />

        <BottomItem
          href="/admin/jogos"
          label="Jogos"
          icon={CalendarDays}
          ativo={pathname.startsWith("/admin/jogos")}
        />

        <BottomItem
          href="/admin/campeonatos"
          label="Campeonatos"
          icon={Trophy}
          ativo={pathname.startsWith("/admin/campeonatos")}
        />
      </nav>
    </div>
  );
}

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
      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
        ativo ? "text-[#18C929]" : "text-white/35"
      }`}
    >
      <Icon size={21} strokeWidth={1.8} />
      {label}
    </Link>
  );
}
