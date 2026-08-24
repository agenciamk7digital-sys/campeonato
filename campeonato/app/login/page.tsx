"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  LockKeyhole,
  Mail,
} from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [redirectPara, setRedirectPara] =
    useState("/admin");

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const redirect =
      parametros.get("redirect");

    if (
      redirect &&
      redirect.startsWith("/admin")
    ) {
      setRedirectPara(
        redirect
      );
    }
  }, []);

  async function entrar() {
    setErro("");

    if (!email.trim()) {
      setErro(
        "Informe seu e-mail."
      );
      return;
    }

    if (!senha) {
      setErro(
        "Informe sua senha."
      );
      return;
    }

    setCarregando(true);

    const supabase =
      createBrowserSupabaseClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim(),
        password:
          senha,
      });

    setCarregando(false);

    if (error) {
      console.error(
        "Erro no login:",
        error
      );

      setErro(
        "E-mail ou senha inválidos."
      );

      return;
    }

    router.replace(
      redirectPara
    );

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030604] px-4 text-white">

      <div className="w-full max-w-md">

        <div className="mb-7 text-center">

          <div className="relative mx-auto h-32 w-40">
            <Image
              src="/fju-esportes.png"
              alt="FJU Esportes"
              fill
              priority
              className="object-contain"
            />
          </div>

          <h1 className="mt-3 text-3xl font-black">
            Área administrativa
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Entre para gerenciar os campeonatos da FJU Esportes.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-[#080D09] p-6 shadow-2xl">

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/60">
              E-mail
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#18C929]">

              <Mail
                size={18}
                className="shrink-0 text-white/30"
              />

              <input
                type="email"
                value={
                  email
                }
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    entrar();
                  }
                }}
                placeholder="admin@fju.com"
                autoComplete="email"
                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="mt-5">

            <label className="mb-2 block text-sm font-semibold text-white/60">
              Senha
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#18C929]">

              <LockKeyhole
                size={18}
                className="shrink-0 text-white/30"
              />

              <input
                type="password"
                value={
                  senha
                }
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    entrar();
                  }
                }}
                placeholder="Sua senha"
                autoComplete="current-password"
                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {erro}
            </div>
          )}

          <button
            type="button"
            onClick={entrar}
            disabled={
              carregando
            }
            className="mt-6 w-full rounded-xl bg-[#18C929] px-4 py-3.5 font-black text-black transition hover:bg-[#32DD40] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}