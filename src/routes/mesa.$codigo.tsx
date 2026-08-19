import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { estatisticas, lerPerfil, rotuloCarta, useMesa, type Perfil } from "@/lib/mesa-store";
import { Avatar, BarraDeAcoes, BaralhoFibonacci, MesaOval } from "@/components/poker/mesa-ui";
import { CamadaBrincadeiras } from "@/components/poker/CamadaBrincadeiras";

export const Route = createFileRoute("/mesa/$codigo")({
  head: () => ({
    meta: [
      { title: "Mesa de Poker Planning — Cadastra" },
      {
        name: "description",
        content:
          "Vote em Fibonacci, revele as cartas com o time e provoque os colegas com avião de papel e reações.",
      },
      { property: "og:title", content: "Mesa de Poker Planning — Cadastra" },
      {
        property: "og:description",
        content: "Votação simultânea em Fibonacci com observadores e brincadeiras.",
      },
    ],
  }),
  component: MesaPage,
});

function MesaPage() {
  const { codigo } = Route.useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const p = lerPerfil();
    if (!p) {
      void navigate({ to: "/" });
      return;
    }
    setPerfil(p);
  }, [navigate]);

  const { mesa, votar, definirHistoria, revelar, novaRodada, brincar, sair } = useMesa(
    codigo,
    perfil,
  );

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(""), 2600);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const jogadores = mesa.participantes.filter((p) => p.papel === "jogador");
  const observadores = mesa.participantes.filter((p) => p.papel === "observador");
  const eu = mesa.participantes.find((p) => p.id === perfil?.id) ?? null;
  const votos = jogadores.filter((p) => p.voto).map((p) => p.voto as string);
  const stats = useMemo(() => (mesa.revelada ? estatisticas(votos) : null), [mesa.revelada, votos]);
  const podeRevelar = !mesa.revelada && votos.length > 0;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setAviso("Link da mesa copiado.");
    } catch {
      setAviso(`Copie manualmente: ${codigo}`);
    }
  }

  return (
    <div className="ab-page pp-mesa-page">
      <header className="pp-topo-min pp-topo-mesa">
        <div className="ab-d-flex ab-ai-center ab-gap-3">
          <img
            className="ab-logo"
            src="https://astraos-cdn.cadastra.com/cadastra-logo-light.svg"
            alt="Cadastra"
            width={104}
            height={22}
          />
          <span className="ab-tag ab-tag--sm">{mesa.codigo}</span>
        </div>
        <input
          className="ab-input pp-historia"
          value={mesa.historia}
          onChange={(e) => definirHistoria(e.target.value)}
          placeholder="Qual história vamos estimar?"
          maxLength={90}
          aria-label="História em estimativa"
        />
        <div className="ab-d-flex ab-ai-center ab-gap-2">
          <button
            type="button"
            className="ab-btn ab-btn--sm ab-btn--secondary-gray"
            onClick={copiarLink}
          >
            Convidar
          </button>
          <Link to="/" className="ab-btn ab-btn--sm ab-btn--link-gray" onClick={() => sair()}>
            Sair
          </Link>
        </div>
      </header>

      {aviso ? <div className="ab-toast ab-toast--primary pp-toast">{aviso}</div> : null}

      <main className="pp-palco">
        <MesaOval
          jogadores={jogadores}
          revelada={mesa.revelada}
          meuId={perfil?.id ?? null}
          onAcionar={(p, tipo, reacao) => brincar(p.id, tipo, reacao)}
        >
          {mesa.revelada ? (
            <button
              type="button"
              className="ab-btn ab-btn--md ab-btn--secondary-gray"
              onClick={novaRodada}
            >
              Nova rodada
            </button>
          ) : podeRevelar ? (
            <button
              type="button"
              className="ab-btn ab-btn--md ab-btn--primary"
              onClick={revelar}
            >
              Revelar cartas
            </button>
          ) : (
            <span className="pp-superficie__dica">
              {jogadores.length <= 1
                ? "Sozinho por aqui — convide o time"
                : "Escolha sua carta"}
            </span>
          )}
        </MesaOval>

        {mesa.revelada && stats ? (
          <div className="pp-resultado">
            <span className="pp-resultado__item">
              Média <strong>{stats.media}</strong>
            </span>
            <span className="pp-resultado__item">
              Moda <strong>{stats.moda}</strong>
            </span>
            <span className="pp-resultado__item">
              Menor <strong>{stats.menor}</strong>
            </span>
            <span className="pp-resultado__item">
              Maior <strong>{stats.maior}</strong>
            </span>
            <span
              className={`ab-badge ab-badge--sm ${stats.consenso ? "ab-badge--success" : "ab-badge--warning"}`}
            >
              {stats.consenso ? "Consenso" : "Sem consenso"}
            </span>
          </div>
        ) : null}

        {observadores.length > 0 ? (
          <div className="pp-observadores">
            {observadores.map((p) => (
              <div key={p.id} className="pp-observador" data-participante={p.id}>
                <Avatar participante={p} tamanho="sm" />
                <span className="ab-text-sm pp-nome">{p.nome}</span>
                {p.id === perfil?.id ? null : (
                  <BarraDeAcoes
                    nome={p.nome}
                    onAcionar={(tipo, reacao) => brincar(p.id, tipo, reacao)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </main>

      <footer className="pp-rodape">
        {eu?.papel === "observador" ? (
          <p className="ab-text-sm ab-text-muted">Você está observando esta rodada.</p>
        ) : (
          <BaralhoFibonacci
            votoAtual={eu?.voto ?? null}
            desabilitado={mesa.revelada}
            onVotar={votar}
          />
        )}
        {mesa.historico.length > 0 ? (
          <details className="pp-historico">
            <summary className="ab-text-xs ab-text-muted">
              Histórico ({mesa.historico.length})
            </summary>
            <ul className="ab-list">
              {mesa.historico.map((r) => (
                <li key={r.id} className="ab-list-item ab-d-flex ab-jc-between ab-gap-3">
                  <span className="ab-text-sm">{r.historia || "Sem título"}</span>
                  <span className="ab-text-sm ab-text-muted">
                    {r.votos.map((v) => rotuloCarta(v.valor)).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <p className="ab-text-xs ab-text-muted pp-aviso-astra">
          Os artefatos gerados pela AstraOS podem conter inconsistências ou imprecisões. Antes de
          qualquer compartilhamento, é obrigatória a validação das informações.
        </p>
      </footer>

      <CamadaBrincadeiras brincadeiras={mesa.brincadeiras} />
    </div>
  );
}
