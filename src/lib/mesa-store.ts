import { useCallback, useEffect, useState } from "react";
import { onValue, ref, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase";

export type Papel = "jogador" | "observador";

export type Participante = {
  id: string;
  nome: string;
  papel: Papel;
  cor: number;
  voto: string | null;
  atualizadoEm: number;
};

export type Rodada = {
  id: string;
  historia: string;
  votos: { nome: string; valor: string }[];
  encerradaEm: number;
};

export type TipoBrincadeira = "aviao" | "bolinha" | "tomate" | "reacao";

export type Brincadeira = {
  id: string;
  tipo: TipoBrincadeira;
  reacao?: string | undefined;
  deId: string;
  deNome: string;
  paraId: string;
  criadoEm: number;
};

export type Mesa = {
  codigo: string;
  historia: string;
  revelada: boolean;
  participantes: Participante[];
  historico: Rodada[];
  brincadeiras: Brincadeira[];
  placar: Record<string, number>;
  criadorId: string | null;
  votacaoIniciadaEm: number;
};

export const CARTAS = ["1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "cafe"] as const;

export const CORES = 8;

export const DURACAO_VOTACAO_SEGUNDOS = 30;

const CHAVE_PERFIL = "poker-planning:perfil";

export type Perfil = { id: string; nome: string; papel: Papel; cor: number };

export function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

export function novoCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += letras[Math.floor(Math.random() * letras.length)];
  return out;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return (partes[0] ?? "").slice(0, 2).toUpperCase();
  const primeiro = partes[0] ?? "";
  const ultimo = partes[partes.length - 1] ?? "";
  return ((primeiro[0] ?? "") + (ultimo[0] ?? "")).toUpperCase();
}

export function lerPerfil(): Perfil | null {
  if (typeof window === "undefined") return null;
  try {
    const cru = window.localStorage.getItem(CHAVE_PERFIL);
    return cru ? (JSON.parse(cru) as Perfil) : null;
  } catch {
    return null;
  }
}

export function salvarPerfil(perfil: Perfil) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil));
}

function mesaVazia(codigo: string): Mesa {
  return {
    codigo,
    historia: "",
    revelada: false,
    participantes: [],
    historico: [],
    brincadeiras: [],
    placar: {},
    criadorId: null,
    votacaoIniciadaEm: Date.now(),
  };
}

function refMesa(codigo: string) {
  return ref(db, `mesas/${codigo}`);
}

export function useMesa(codigo: string, perfil: Perfil | null) {
  const [mesa, setMesa] = useState<Mesa>(() => mesaVazia(codigo));
  const [pronto, setPronto] = useState(false);

  const atualizar = useCallback(
    (fn: (atual: Mesa) => Mesa) => {
      void runTransaction(refMesa(codigo), (bruto: Mesa | null) => {
        const atual = bruto ? { ...mesaVazia(codigo), ...bruto } : mesaVazia(codigo);
        // JSON.parse/stringify remove chaves `undefined`, que o Realtime Database rejeita.
        return JSON.parse(JSON.stringify(fn(atual))) as Mesa;
      });
    },
    [codigo],
  );

  useEffect(() => {
    setPronto(false);
    const unsubscribe = onValue(refMesa(codigo), (snapshot) => {
      const valor = snapshot.val() as Mesa | null;
      setMesa(valor ? { ...mesaVazia(codigo), ...valor } : mesaVazia(codigo));
      setPronto(true);
    });
    return () => unsubscribe();
  }, [codigo]);

  // Garante que o participante local esteja na mesa. Quem chega primeiro numa
  // mesa vazia vira o criador (só ele pode revelar cartas e iniciar rodadas).
  useEffect(() => {
    if (!pronto || !perfil) return;
    atualizar((atual) => {
      const existente = atual.participantes.find((p) => p.id === perfil.id);
      const criadorId = atual.criadorId ?? (atual.participantes.length === 0 ? perfil.id : null);
      if (
        existente &&
        existente.nome === perfil.nome &&
        existente.papel === perfil.papel &&
        existente.cor === perfil.cor &&
        criadorId === atual.criadorId
      ) {
        return atual;
      }
      const participante: Participante = {
        id: perfil.id,
        nome: perfil.nome,
        papel: perfil.papel,
        cor: perfil.cor,
        voto: existente?.voto ?? null,
        atualizadoEm: Date.now(),
      };
      return {
        ...atual,
        criadorId,
        participantes: existente
          ? atual.participantes.map((p) => (p.id === perfil.id ? participante : p))
          : [...atual.participantes, participante],
      };
    });
  }, [pronto, perfil, atualizar]);

  const votar = useCallback(
    (valor: string) => {
      if (!perfil) return;
      atualizar((atual) => ({
        ...atual,
        participantes: atual.participantes.map((p) =>
          p.id === perfil.id
            ? { ...p, voto: p.voto === valor ? null : valor, atualizadoEm: Date.now() }
            : p,
        ),
      }));
    },
    [atualizar, perfil],
  );

  const definirHistoria = useCallback(
    (historia: string) => atualizar((atual) => ({ ...atual, historia })),
    [atualizar],
  );

  const revelar = useCallback(
    () => atualizar((atual) => ({ ...atual, revelada: true })),
    [atualizar],
  );

  const novaRodada = useCallback(
    () =>
      atualizar((atual) => {
        const votos = atual.participantes
          .filter((p) => p.papel === "jogador" && p.voto)
          .map((p) => ({ nome: p.nome, valor: p.voto as string }));
        const historico =
          atual.revelada && votos.length > 0
            ? [
                {
                  id: novoId(),
                  historia: atual.historia || "Sem título",
                  votos,
                  encerradaEm: Date.now(),
                },
                ...atual.historico,
              ].slice(0, 12)
            : atual.historico;
        return {
          ...atual,
          revelada: false,
          historia: "",
          historico,
          votacaoIniciadaEm: Date.now(),
          participantes: atual.participantes.map((p) => ({ ...p, voto: null })),
        };
      }),
    [atualizar],
  );

  const sair = useCallback(() => {
    if (!perfil) return;
    atualizar((atual) => ({
      ...atual,
      participantes: atual.participantes.filter((p) => p.id !== perfil.id),
    }));
  }, [atualizar, perfil]);

  const brincar = useCallback(
    (paraId: string, tipo: TipoBrincadeira, reacao?: string) => {
      if (!perfil) return;
      atualizar((atual) => ({
        ...atual,
        brincadeiras: [
          ...atual.brincadeiras.filter((b) => Date.now() - b.criadoEm < 6000),
          {
            id: novoId(),
            tipo,
            reacao,
            deId: perfil.id,
            deNome: perfil.nome,
            paraId,
            criadoEm: Date.now(),
          },
        ].slice(-12),
        placar: { ...atual.placar, [perfil.id]: (atual.placar[perfil.id] ?? 0) + 1 },
      }));
    },
    [atualizar, perfil],
  );

  return {
    mesa,
    pronto,
    votar,
    definirHistoria,
    revelar,
    novaRodada,
    brincar,
    sair,
  };
}

export function rotuloCarta(valor: string) {
  return valor === "cafe" ? "Café" : valor;
}

export function estatisticas(votos: string[]) {
  const numericos = votos.map(Number).filter((n) => Number.isFinite(n));
  if (numericos.length === 0) return null;
  const media = numericos.reduce((a, b) => a + b, 0) / numericos.length;
  const contagem = new Map<number, number>();
  numericos.forEach((n) => contagem.set(n, (contagem.get(n) ?? 0) + 1));
  let moda = numericos[0] as number;
  let maiorContagem = 0;
  contagem.forEach((qtd, valor) => {
    if (qtd > maiorContagem) {
      maiorContagem = qtd;
      moda = valor;
    }
  });
  return {
    media: Math.round(media * 10) / 10,
    moda,
    menor: Math.min(...numericos),
    maior: Math.max(...numericos),
    consenso: new Set(numericos).size === 1,
  };
}
