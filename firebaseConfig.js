import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import { collection, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// As SUAS chaves verdadeiras copiadas do painel do Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "gestao-junina.firebaseapp.com",
  projectId: "gestao-junina",
  storageBucket: "gestao-junina.firebasestorage.app",
  messagingSenderId: "427754658747",
  appId: "1:427754658747:web:122df2e0c55536545f429e",
};

// 1. Inicializar a App
const app = initializeApp(firebaseConfig);

// 2. Inicializar a Autenticação de forma inteligente (Web vs Mobile)
let authInstance;

if (Platform.OS === "web") {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} else {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export const auth = authInstance;

// 3. Inicializar a Base de Dados
export const db = getFirestore(app);

// 4. Exportar o App ID manualmente
export const appId = "gestao-junina-loja";

// 🔒 A LISTA OFICIAL DE GAVETAS (Constantes)
// Se precisar de uma nova gaveta no futuro, adicione-a APENAS AQUI.
export const GAVETAS = {
  ACERVO: "kits",
  AGENDA: "alugueres",
  FINANCEIRO: "financeiro",
  CLIENTES: "clientes",
  DESPESAS: "despesas",
};

// 👇 O NOSSO GPS CENTRAL BLINDADO 👇
export const getGaveta = (nomeDaGaveta) => {
  // 🚨 O Alarme: Se alguém tentar abrir uma gaveta que não existe na lista oficial, ele avisa!
  const gavetasPermitidas = Object.values(GAVETAS);
  if (!gavetasPermitidas.includes(nomeDaGaveta)) {
    console.error(
      `🚨 ERRO GRAVE: Tentativa de acessar a gaveta fantasma '${nomeDaGaveta}'. Verifique o nome!`,
    );
  }

  return collection(
    db,
    "artifacts",
    String(appId),
    "public",
    "data",
    nomeDaGaveta,
  );
};
