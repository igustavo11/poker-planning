import { useEffect, useRef, useState } from "react";
import type { Brincadeira } from "@/lib/mesa-store";
import { IconeAcao } from "@/components/poker/mesa-ui";

type Voo = {
  id: string;
  tipo: Brincadeira["tipo"];
  reacao?: string | undefined;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  deNome: string;
};

function centro(id: string) {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-participante="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function Objeto({ voo, onFim }: { voo: Voo; onFim: (id: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.setProperty("--pp-x1", `${voo.x1}px`);
      el.style.setProperty("--pp-y1", `${voo.y1}px`);
      el.style.setProperty("--pp-x2", `${voo.x2}px`);
      el.style.setProperty("--pp-y2", `${voo.y2}px`);
    }
    const t = window.setTimeout(() => onFim(voo.id), 1800);
    return () => window.clearTimeout(t);
  }, [voo, onFim]);

  const chaveIcone = voo.tipo === "reacao" ? (voo.reacao ?? "") : voo.tipo;

  return (
    <div ref={ref} className={`pp-voo pp-voo--${voo.tipo} pp-voo--${chaveIcone}`} aria-hidden="true">
      <IconeAcao chave={chaveIcone} tamanho={30} />
    </div>
  );
}

export function CamadaBrincadeiras({ brincadeiras }: { brincadeiras: Brincadeira[] }) {
  const [voos, setVoos] = useState<Voo[]>([]);
  const vistos = useRef<Set<string>>(new Set());

  useEffect(() => {
    const novos: Voo[] = [];
    brincadeiras.forEach((b) => {
      if (vistos.current.has(b.id)) return;
      vistos.current.add(b.id);
      if (Date.now() - b.criadoEm > 5000) return;
      const origem = centro(b.deId);
      const destino = centro(b.paraId);
      if (!destino) return;
      novos.push({
        id: b.id,
        tipo: b.tipo,
        reacao: b.reacao,
        x1: origem?.x ?? destino.x,
        y1: origem?.y ?? destino.y + 240,
        x2: destino.x,
        y2: destino.y,
        deNome: b.deNome,
      });
    });
    if (novos.length > 0) setVoos((atual) => [...atual, ...novos]);
  }, [brincadeiras]);

  const remover = (id: string) => setVoos((atual) => atual.filter((v) => v.id !== id));

  return (
    <div className="pp-camada">
      {voos.map((voo) => (
        <Objeto key={voo.id} voo={voo} onFim={remover} />
      ))}
    </div>
  );
}
