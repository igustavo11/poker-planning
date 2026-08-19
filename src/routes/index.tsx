import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CORES,
  iniciais,
  lerPerfil,
  novoCodigo,
  novoId,
  salvarPerfil,
  type Papel,
} from "@/lib/mesa-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poker Planning Cadastra — estimativas em Fibonacci" },
      {
        name: "description",
        content:
          "Entre numa mesa de planning poker com cartas Fibonacci de 1 a 89, observadores e brincadeiras entre o time. Sem cadastro.",
      },
      { property: "og:title", content: "Poker Planning Cadastra" },
      {
        property: "og:description",
        content: "Estimativas em Fibonacci, sem login, com a cara do time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entrada,
});


function Entrada() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("jogador");
  const [cor, setCor] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const perfil = lerPerfil();
    if (perfil) {
      setNome(perfil.nome);
      setPapel(perfil.papel);
      setCor(perfil.cor);
    } else {
      setCor(Math.floor(Math.random() * CORES));
    }
  }, []);

  function entrar(destino: string) {
    if (nome.trim().length < 2) {
      setErro("Diga seu nome para sentar à mesa.");
      return;
    }
    const perfil = lerPerfil();
    salvarPerfil({ id: perfil?.id ?? novoId(), nome: nome.trim(), papel, cor });
    void navigate({ to: "/mesa/$codigo", params: { codigo: destino } });
  }

  return (
    <div className="ab-page pp-entrada">
      <header className="pp-topo-min">
        <img
          className="ab-logo"
          src="https://astraos-cdn.cadastra.com/cadastra-logo-light.svg"
          alt="Cadastra"
          width={116}
          height={24}
        />
        <span className="ab-badge ab-badge--sm ab-badge--gray">Poker Planning</span>
      </header>

      <main className="pp-entrada__palco">
        <div className="pp-entrar-card">
          <div className="pp-entrar">
            <h1 className="pp-titulo">Sente à mesa</h1>

            <div className="pp-entrar__linha">
              <input
                id="nome"
                className={`ab-input pp-entrar__nome${erro ? " ab-input--error" : ""}`}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro("");
                }}
                placeholder="Seu nome"
                maxLength={24}
                aria-label="Seu nome"
              />
            </div>

            <div className="pp-swatches">
              {Array.from({ length: CORES }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Cor ${i + 1}`}
                  className={`pp-swatch pp-cor-${i}${cor === i ? " pp-swatch--ativo" : ""}`}
                  onClick={() => setCor(i)}
                >
                  <span className="pp-swatch__iniciais">{iniciais(nome || "Eu")}</span>
                </button>
              ))}
            </div>

            <div className="pp-toggle">
              <button
                type="button"
                className={`pp-toggle__op${papel === "jogador" ? " pp-toggle__op--on" : ""}`}
                onClick={() => setPapel("jogador")}
              >
                Jogar
              </button>
              <button
                type="button"
                className={`pp-toggle__op${papel === "observador" ? " pp-toggle__op--on" : ""}`}
                onClick={() => setPapel("observador")}
              >
                Observar
              </button>
            </div>

            {erro ? <p className="ab-text-sm ab-text-error">{erro}</p> : null}

            <button
              type="button"
              className="ab-btn ab-btn--lg ab-btn--primary pp-entrar__cta"
              onClick={() => entrar(novoCodigo())}
            >
              Abrir mesa nova
            </button>

            <div className="pp-entrar__codigo">
              <input
                className="ab-input"
                value={codigo}
                onChange={(e) =>
                  setCodigo(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  )
                }
                placeholder="Código"
                aria-label="Código da mesa"
              />
              <button
                type="button"
                className="ab-btn ab-btn--md ab-btn--secondary-gray"
                onClick={() =>
                  codigo.length >= 4 ? entrar(codigo) : setErro("Código inválido.")
                }
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

