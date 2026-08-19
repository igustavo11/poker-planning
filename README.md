# Poker Planning

App de planning poker em Fibonacci: vote com o time, revele as cartas juntos e provoque os colegas com avião de papel, bolinha de papel, tomate e reações. Sem cadastro — só entrar com um nome e o código da mesa.

O estado da mesa (participantes, votos, histórico) sincroniza em tempo real entre todos os dispositivos via Firebase Realtime Database.

## Desenvolvimento

Requer [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Firebase (Realtime Database).

## Build

```sh
bun run build
```

## Stack

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Firebase Realtime Database
