"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Campeonato = {
  id: number;
  nome: string;
  temporada: string | null;
  ano: number | null;
};

type Time = {
  id: number;
  nome: string;
  sigla: string | null;
  escudo_url: string | null;
  campeonato_id: number | null;
};

type Jogador = {
  id: number;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  time_id: number | null;
};

export default function AdminJogadoresPage() {
  const [campeonatos, setCampeonatos] =
    useState<Campeonato[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [jogadores, setJogadores] =
    useState<Jogador[]>([]);

  const [campeonatoId, setCampeonatoId] =
    useState("");

  const [timeId, setTimeId] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [numero, setNumero] =
    useState("");

  const [fotoUrl, setFotoUrl] =
    useState("");

  const [
    filtroCampeonatoId,
    setFiltroCampeonatoId,
  ] = useState("");

  const [filtroTimeId, setFiltroTimeId] =
    useState("");

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
        ano
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
      .order("nome", {
        ascending: true,
      });

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

    setTimes(
      (data ?? []) as Time[]
    );
  }

  async function carregarJogadores() {
    const { data, error } = await supabase
      .from("jogadores")
      .select(`
        id,
        nome,
        numero,
        foto_url,
        time_id
      `)
      .order("nome", {
        ascending: true,
      });

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
      (data ?? []) as Jogador[]
    );
  }

  useEffect(() => {
    carregarCampeonatos();
    carregarTimes();
    carregarJogadores();

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const campeonatoUrl =
      parametros.get("campeonato") || "";

    const timeUrl =
      parametros.get("time") || "";

    if (campeonatoUrl) {
      setCam