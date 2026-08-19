# Poker Planning — Astra Design System (Cadastra)

App de planning poker em pt-BR, sem login, usando o Astra Bootstrap (classes `ab-*`) e a logo oficial da Cadastra.

## Estado e sincronização

Sem backend: toda a mesa vive em `localStorage`, com sincronização entre abas/janelas do mesmo navegador via `storage` events + `BroadcastChannel`. Publicando na Vercel, cada navegador tem sua própria mesa (sala por código na URL, ex. `/mesa/ABC123`, guardada localmente).

## Telas

1. **/** — entrada: nome, avatar (iniciais + cor), escolher "Jogador" ou "Observador", botão criar mesa ou entrar com código.
2. **/mesa/$codigo** — a mesa:
   - Header com logo Cadastra, nome da história em edição, código da sala.
   - Aviso obrigatório do DS no topo.
   - Mesa central oval com os cards de cada participante (verso enquanto vota, valor após revelar). Observadores aparecem na borda, sem card de voto.
   - Baralho Fibonacci: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89 + `?` e `☕`.
   - Ações: Revelar votos, Nova rodada, Copiar link.
   - Após revelar: média, moda, maior/menor, indicador de consenso.
   - Histórico das rodadas da sessão.

## Brincadeiras

Barra de ações ao clicar em um avatar:
- **Avião de papel** — SVG que voa em arco do seu card até o alvo.
- **Bolinha de papel / tomate** — arremesso com splat animado no avatar.
- **Cutucar + emojis** — reações (fogo, café, zzz, palmas) flutuando sobre o avatar.

Tudo propagado pelo mesmo canal de estado, com fila de animações para não sobrepor.

## Regras do Design System

- `<link>` do `astraos-bootstrap.css` no `head` da rota raiz, antes de qualquer outra folha.
- Componentes com `ab-*` (`ab-card`, `ab-btn`, `ab-badge`, `ab-tag`, `ab-grid`, `ab-col-*`); nada de hex hardcoded nem `style` inline (exceto variável CSS de progresso).
- Logo `cadastra-logo-light.svg` em tema claro, `cadastra-logo-dark.svg` em tema escuro, com `alt="Cadastra"`.
- Textos em pt-BR, sem emoji em texto visível (emojis só como elementos de reação ilustrada em SVG/ícone).
- Grid rico no desktop; empilhar só em tablet/mobile via `ab-col-md-*` / `ab-col-sm-*`.

## Detalhes técnicos

- Rotas TanStack: `src/routes/index.tsx` (entrada) e `src/routes/mesa.$codigo.tsx`, cada uma com `head()` própria.
- `src/lib/mesa-store.ts`: tipos (Participante, Voto, Rodada, Evento de brincadeira), leitura/escrita em `localStorage`, hook `useMesa(codigo)` com sincronização via `BroadcastChannel` + `storage`.
- Componentes: `MesaLayout`, `CartaParticipante`, `BaralhoFibonacci`, `ResultadoRodada`, `CamadaBrincadeiras` (animações CSS/keyframes em `src/styles.css`, sem inline).
- Todo acesso a `localStorage` dentro de `useEffect` para não quebrar o SSR.
