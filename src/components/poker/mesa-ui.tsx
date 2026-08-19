import { useEffect, useRef } from "react";
import { CARTAS, iniciais, rotuloCarta, type Participante } from "@/lib/mesa-store";

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

/** Distribui os lugares na borda de uma elipse, começando embaixo (frente da mesa). */
function posicao(indice: number, total: number) {
  const angulo = Math.PI / 2 + (indice * 2 * Math.PI) / Math.max(total, 1);
  return {
    x: 50 + 42 * Math.cos(angulo),
    y: 50 + 40 * Math.sin(angulo),
  };
}

function useCoordenadas(x: number, y: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--pp-lx", `${x}%`);
    el.style.setProperty("--pp-ly", `${y}%`);
  }, [x, y]);
  return ref;
}

function LugarVazio({ x, y }: { x: number; y: number }) {
  const ref = useCoordenadas(x, y);
  return (
    <div ref={ref} className={`pp-lugar pp-lugar--vazio${y < 45 ? " pp-lugar--topo" : ""}`}>
      <div className="pp-carta pp-carta--vazia" aria-hidden="true" />
    </div>
  );
}

export function LugarParticipante({
  participante,
  revelada,
  souEu,
  onBrincar,
  x,
  y,
}: {
  participante: Participante;
  revelada: boolean;
  souEu: boolean;
  onBrincar: () => void;
  x: number;
  y: number;
}) {
  const ref = useCoordenadas(x, y);
  const votou = Boolean(participante.voto);

  return (
    <div
      ref={ref}
      className={`pp-lugar${souEu ? " pp-lugar--eu" : ""}${y < 45 ? " pp-lugar--topo" : ""}`}
    >
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
        <span className="ab-text-sm pp-nome">{participante.nome}</span>
        {souEu ? null : (
          <button
            type="button"
            className="pp-provocar"
            aria-label={`Provocar ${participante.nome}`}
            onClick={onBrincar}
          >
            ✈
          </button>
        )}
      </div>
    </div>
  );
}

export function MesaOval({
  jogadores,
  revelada,
  meuId,
  onBrincar,
  minimoLugares = 0,
  children,
}: {
  jogadores: Participante[];
  revelada: boolean;
  meuId: string | null;
  onBrincar: (p: Participante) => void;
  minimoLugares?: number;
  children: React.ReactNode;
}) {
  const total = Math.max(jogadores.length, minimoLugares, 1);
  const vazios = Math.max(total - jogadores.length, 0);

  return (
    <div className="pp-arena">
      <div className="pp-superficie">
        <div className="pp-superficie__centro">{children}</div>
      </div>

      {jogadores.map((p, i) => {
        const { x, y } = posicao(i, total);
        return (
          <LugarParticipante
            key={p.id}
            participante={p}
            revelada={revelada}
            souEu={p.id === meuId}
            onBrincar={() => onBrincar(p)}
            x={x}
            y={y}
          />
        );
      })}

      {Array.from({ length: vazios }, (_, i) => {
        const { x, y } = posicao(jogadores.length + i, total);
        return <LugarVazio key={`vazio-${i}`} x={x} y={y} />;
      })}
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
