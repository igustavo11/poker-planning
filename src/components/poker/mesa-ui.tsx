import { useEffect, useRef, useState } from "react";
import { CARTAS, iniciais, rotuloCarta, type Participante, type TipoBrincadeira } from "@/lib/mesa-store";

export type Acao = {
  chave: string;
  tipo: TipoBrincadeira;
  reacao?: string;
  rotulo: string;
};

export const ACOES: Acao[] = [
  { chave: "aviao", tipo: "aviao", rotulo: "Avião de papel" },
  { chave: "bolinha", tipo: "bolinha", rotulo: "Bolinha de papel" },
  { chave: "tomate", tipo: "tomate", rotulo: "Tomate" },
  { chave: "fogo", tipo: "reacao", reacao: "fogo", rotulo: "Fogo" },
  { chave: "cafe", tipo: "reacao", reacao: "cafe", rotulo: "Café" },
  { chave: "sono", tipo: "reacao", reacao: "sono", rotulo: "Sono" },
  { chave: "palmas", tipo: "reacao", reacao: "palmas", rotulo: "Palmas" },
];

/** Ícones vetoriais no lugar de emoji — reaproveitado pela animação em CamadaBrincadeiras. */
export function IconeAcao({ chave, tamanho = 15 }: { chave: string; tamanho?: number }) {
  switch (chave) {
    case "aviao":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 12 22 3l-5 18-4.5-6.5L2 12Z" fill="currentColor" />
        </svg>
      );
    case "bolinha":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <path
            d="M7 10l4 3-2 4M14 7l3 4-4 3"
            stroke="var(--base-white, #fff)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );
    case "tomate":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="14" r="8" fill="currentColor" />
          <path d="M8 6l4 2 4-2-4 1z" fill="var(--success-medium-dark, #00a700)" />
        </svg>
      );
    case "fogo":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2c1.1 3-.2 4.4-1.5 5.8C9.2 9.3 8 10.9 8 13a4 4 0 0 0 8 .3c.3-1.4-.1-2.4-.7-3.2.3 1.5-.5 2.1-1 2-.1-2.7-1-4.8-2.3-10.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "cafe":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" fill="currentColor" />
          <path
            d="M16 9.5h1a2.25 2.25 0 0 1 0 4.5h-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M8 2.5c0 1-1 1-1 2M12 2.5c0 1-1 1-1 2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "sono":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5Z" fill="currentColor" />
        </svg>
      );
    case "palmas":
      return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

const ATRASO_FECHAR_MS = 350;

/** Nome + menu de ações vivem no mesmo elemento hoverável, com atraso pra fechar —
 * assim o cursor consegue atravessar o espaço até um ícone sem o menu sumir no meio do caminho. */
export function GatilhoDeAcoes({
  nome,
  onAcionar,
  children,
}: {
  nome: string;
  onAcionar: (tipo: TipoBrincadeira, reacao?: string) => void;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const fecharRef = useRef<number | null>(null);

  function cancelarFechamento() {
    if (fecharRef.current !== null) {
      window.clearTimeout(fecharRef.current);
      fecharRef.current = null;
    }
  }

  function abrir() {
    cancelarFechamento();
    setAberto(true);
  }

  function fecharComAtraso() {
    cancelarFechamento();
    fecharRef.current = window.setTimeout(() => setAberto(false), ATRASO_FECHAR_MS);
  }

  useEffect(() => cancelarFechamento, []);

  return (
    <div
      className="pp-gatilho"
      onMouseEnter={abrir}
      onMouseLeave={fecharComAtraso}
      onFocus={abrir}
      onBlur={fecharComAtraso}
    >
      {children}
      <div className={`pp-acoes${aberto ? " pp-acoes--aberta" : ""}`}>
        {ACOES.map((a) => (
          <button
            key={a.chave}
            type="button"
            className={`pp-acao pp-acao--${a.chave}`}
            title={a.rotulo}
            aria-label={`${a.rotulo} para ${nome}`}
            onClick={() => onAcionar(a.tipo, a.reacao)}
          >
            <IconeAcao chave={a.chave} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Avatar({
  participante,
  tamanho = "md",
}: {
  participante: Participante;
  tamanho?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`ab-avatar ab-avatar--${tamanho} pp-avatar pp-cor-${participante.cor}`}
      title={participante.nome}
    >
      {iniciais(participante.nome)}
    </span>
  );
}

export function LugarParticipante({
  participante,
  revelada,
  souEu,
  onAcionar,
}: {
  participante: Participante;
  revelada: boolean;
  souEu: boolean;
  onAcionar: (tipo: TipoBrincadeira, reacao?: string) => void;
}) {
  const votou = Boolean(participante.voto);

  return (
    <div className={`pp-lugar${souEu ? " pp-lugar--eu" : ""}`}>
      <div
        className={`pp-carta${votou ? " pp-carta--votou" : ""}${
          revelada && votou ? " pp-carta--aberta" : ""
        }`}
        data-participante={participante.id}
      >
        <span className="pp-carta__valor">
          {revelada && participante.voto ? rotuloCarta(participante.voto) : ""}
        </span>
      </div>
      <div className="pp-lugar__pessoa">
        {souEu ? (
          <span className="ab-text-sm pp-nome">{participante.nome}</span>
        ) : (
          <GatilhoDeAcoes nome={participante.nome} onAcionar={onAcionar}>
            <span className="ab-text-sm pp-nome">{participante.nome}</span>
          </GatilhoDeAcoes>
        )}
      </div>
    </div>
  );
}

/** Hash estável (não muda de sessão pra sessão) só pra embaralhar quem senta onde. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return h;
}

const PADRAO_ASSENTOS = ["esquerda", "topo", "topo", "topo", "direita", "base", "base", "base"] as const;

type Lado = (typeof PADRAO_ASSENTOS)[number];

/** Distribui os jogadores ao redor de uma mesa retangular: 1 em cada ponta,
 * até 3 de cada lado — em vez de uma fileira única, que não parece uma mesa. */
function distribuirAssentos(jogadores: Participante[]) {
  const embaralhados = [...jogadores].sort((a, b) => hashId(a.id) - hashId(b.id));
  const grupos: Record<Lado, Participante[]> = { esquerda: [], topo: [], direita: [], base: [] };
  embaralhados.forEach((p, i) => {
    const lado = PADRAO_ASSENTOS[i];
    if (lado) {
      grupos[lado].push(p);
    } else {
      // mais de 8 jogadores: estende o lado mais curto em vez de esconder alguém.
      grupos[grupos.topo.length <= grupos.base.length ? "topo" : "base"].push(p);
    }
  });
  return grupos;
}

export function MesaHorizontal({
  jogadores,
  revelada,
  meuId,
  onAcionar,
  children,
}: {
  jogadores: Participante[];
  revelada: boolean;
  meuId: string | null;
  onAcionar: (p: Participante, tipo: TipoBrincadeira, reacao?: string) => void;
  children: React.ReactNode;
}) {
  const { esquerda, topo, direita, base } = distribuirAssentos(jogadores);
  const ponta = esquerda[0];
  const pontaOposta = direita[0];

  function lugar(p: Participante) {
    return (
      <LugarParticipante
        key={p.id}
        participante={p}
        revelada={revelada}
        souEu={p.id === meuId}
        onAcionar={(tipo, reacao) => onAcionar(p, tipo, reacao)}
      />
    );
  }

  return (
    <div className="pp-arena">
      {topo.length > 0 ? <div className="pp-fileira-lateral">{topo.map(lugar)}</div> : null}

      <div className="pp-linha-central">
        {ponta ? lugar(ponta) : null}
        <div className="pp-superficie">
          <div className="pp-superficie__centro">{children}</div>
        </div>
        {pontaOposta ? lugar(pontaOposta) : null}
      </div>

      {base.length > 0 ? <div className="pp-fileira-lateral">{base.map(lugar)}</div> : null}
    </div>
  );
}

export function BaralhoFibonacci({
  votoAtual,
  desabilitado,
  onVotar,
}: {
  votoAtual: string | null;
  desabilitado: boolean;
  onVotar: (valor: string) => void;
}) {
  return (
    <div className="pp-baralho">
      {CARTAS.map((valor) => (
        <button
          key={valor}
          type="button"
          className={`pp-mao-carta${votoAtual === valor ? " pp-mao-carta--ativa" : ""}`}
          onClick={() => onVotar(valor)}
          disabled={desabilitado}
        >
          {rotuloCarta(valor)}
        </button>
      ))}
    </div>
  );
}
