import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  OPCOES_DURACAO_VOTACAO,
  estatisticas,
  lerPerfil,
  rotuloCarta,
  useMesa,
  type Perfil,
} from "@/lib/mesa-store";
import { Avatar, GatilhoDeAcoes, BaralhoFibonacci, MesaHorizontal } from "@/components/poker/mesa-ui";
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

  const { mesa, votar, definirHistoria, definirDuracao, revelar, novaRodada, brincar, sair } =
    useMesa(codigo, perfil);

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

  const criadorPresente = mesa.participantes.some((p) => p.id === mesa.criadorId);
  const souCriador = perfil !== null && perfil.id === mesa.criadorId;
  // Se o criador saiu da mesa, ninguém fica travado sem poder controlar a rodada.
  const podeControlar = souCriador || !criadorPresente;
  const podeRevelar = podeControlar && !mesa.revelada && votos.length > 0;

  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const segundosRestantes = mesa.revelada
    ? mesa.duracaoVotacaoSegundos
    : Math.max(
        0,
        mesa.duracaoVotacaoSegundos - Math.floor((agora - mesa.votacaoIniciadaEm) / 1000),
      );

  const autoRevelouRef = useRef<number | null>(null);
  useEffect(() => {
    if (mesa.revelada) return;
    if (segundosRestantes > 0) return;
    if (votos.length === 0) return;
    if (!podeControlar) return;
    if (autoRevelouRef.current === mesa.votacaoIniciadaEm) return;
    autoRevelouRef.current = mesa.votacaoIniciadaEm;
    revelar();
  }, [segundosRestantes, mesa.revelada, mesa.votacaoIniciadaEm, votos.length, podeControlar, revelar]);

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
        <MesaHorizontal
          jogadores={jogadores}
          revelada={mesa.revelada}
          meuId={perfil?.id ?? null}
          onAcionar={(p, tipo, reacao) => brincar(p.id, tipo, reacao)}
        >
          {mesa.revelada ? null : (
            <div className="pp-cronometro-linha">
              <span
                className={`pp-cronometro${segundosRestantes <= 10 ? " pp-cronometro--urgente" : ""}`}
              >
                {segundosRestantes}s
              </span>
              {souCriador ? (
                <select
                  className="pp-cronometro-select"
                  value={mesa.duracaoVotacaoSegundos}
                  onChange={(e) => definirDuracao(Number(e.target.value))}
                  aria-label="Tempo para votar por rodada"
                >
                  {OPCOES_DURACAO_VOTACAO.map((segundos) => (
                    <option key={segundos} value={segundos}>
                      {segundos}s por rodada
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          )}
          {mesa.revelada ? (
            podeControlar ? (
              <button
                type="button"
                className="ab-btn ab-btn--md ab-btn--secondary-gray"
                onClick={novaRodada}
              >
                Nova rodada
              </button>
            ) : (
              <span className="pp-superficie__dica">Aguardando nova rodada</span>
            )
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
                : !podeControlar && votos.length > 0
                  ? "Aguardando o criador revelar"
                  : "Escolha sua carta"}
            </span>
          )}
        </MesaHorizontal>

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
                {p.id === perfil?.id ? (
                  <span className="ab-text-sm pp-nome">{p.nome}</span>
                ) : (
                  <GatilhoDeAcoes
                    nome={p.nome}
                    onAcionar={(tipo, reacao) => brincar(p.id, tipo, reacao)}
                  >
                    <span className="ab-text-sm pp-nome">{p.nome}</span>
                  </GatilhoDeAcoes>
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
