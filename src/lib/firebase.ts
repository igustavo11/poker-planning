import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

function env(chave: string): string {
  const valor = import.meta.env[chave];
  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${chave}. Confira o seu .env`);
  }
  // Remove aspas/barras invertidas coladas nas pontas — sobra comum de copiar
  // e colar o valor em painéis como o da Vercel.
  return valor.trim().replace(/^[\s"'\\]+|[\s"'\\]+$/g, "");
}

const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN"),
  databaseURL: env("VITE_FIREBASE_DATABASE_URL"),
  projectId: env("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("VITE_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
