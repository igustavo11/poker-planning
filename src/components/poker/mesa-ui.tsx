import { useEffect, useRef, useState } from "react";
import { CARTAS, iniciais, rotuloCarta, type Participante, type TipoBrincadeira } from "@/lib/mesa-store";

export type Acao = {
  chave: string;
  tipo: TipoBrincadeira;
  reacao?: string;
  simbolo: string;
  rotulo: string;
};

export const ACOES: Acao[] = [
  { chave: "aviao", tipo: "aviao", simbolo: "✈️", rotulo: "Avião de papel" },
  { chave: "bolinha", tipo: "bolinha", simbolo: "⚫", rotulo: "Bolinha de papel" },
  { chave: "tomate", tipo: "tomate", simbolo: "🍅", rotulo: "Tomate" },
  { chave: "fogo", tipo: "reacao", reacao: "🔥", simbolo: "🔥", rotulo: "Fogo" },
  { chave: "cafe", tipo: "reacao", reacao: "☕", simbolo: "☕", rotulo: "Café" },
  { chave: "sono", tipo: "reacao", reacao: "💤", simbolo: "💤", rotulo: "Sono" },
  { chave: "palmas", tipo: "reacao", reacao: "👏", simbolo: "👏", rotulo: "Palmas" },
];

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
            className="pp-acao"
            title={a.rotulo}
            aria-label={`${a.rotulo} para ${nome}`}
            onClick={() => {
              onAcionar(a.tipo, a.reacao);
              setAberto(false);
            }}
          >
            {a.simbolo}
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
  return (
    <div className="pp-arena">
      <div className="pp-superficie">
        <div className="pp-superficie__centro">{children}</div>
      </div>

      <div className="pp-fileira">
        {jogadores.map((p) => (
          <LugarParticipante
            key={p.id}
            participante={p}
            revelada={revelada}
            souEu={p.id === meuId}
            onAcionar={(tipo, reacao) => onAcionar(p, tipo, reacao)}
          />
        ))}
      </div>
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
