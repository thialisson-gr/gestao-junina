import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query, // Adicionado
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { appId } from "../firebaseConfig";

// Ouvir os clientes em tempo real
export const escutarClientes = (callback: any, errorCallback: any) => {
  try {
    const db = getFirestore();
    const clientesRef = collection(
      db,
      "artifacts",
      String(appId || "gestao-junina-loja"),
      "public",
      "data",
      "clientes",
    );
    const q = query(clientesRef);

    // Certifique-se de que onSnapshot é chamado como função direta
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenar os clientes por nome alfabeticamente
        docs.sort((a: any, b: any) => {
          const nomeA = a.responsavel_nome || "";
          const nomeB = b.responsavel_nome || "";
          return nomeA.localeCompare(nomeB);
        });

        callback(docs);
      },
      (error) => {
        console.error("Erro no onSnapshot:", error);
        errorCallback(error);
      },
    );
  } catch (error) {
    console.error("Erro no escutarClientes:", error);
    errorCallback(error);
    return () => {};
  }
};

// Adicionar um novo cliente
export const adicionarCliente = async (dadosCliente: any, userId: string) => {
  const db = getFirestore();
  const clientesRef = collection(
    db,
    "artifacts",
    String(appId || "gestao-junina-loja"),
    "public",
    "data",
    "clientes",
  );

  return await addDoc(clientesRef, {
    ...dadosCliente,
    userId: userId,
    criado_em: serverTimestamp(),
  });
};

// Atualizar um cliente existente
export const atualizarCliente = async (
  idDoCliente: string,
  dadosAtualizados: any,
) => {
  const db = getFirestore();
  const clienteRef = doc(
    db,
    "artifacts",
    String(appId || "gestao-junina-loja"),
    "public",
    "data",
    "clientes",
    idDoCliente,
  );
  return await updateDoc(clienteRef, dadosAtualizados);
};

// Excluir um cliente
export const excluirCliente = async (idDoCliente: string) => {
  const db = getFirestore();
  const clienteRef = doc(
    db,
    "artifacts",
    String(appId || "gestao-junina-loja"),
    "public",
    "data",
    "clientes",
    idDoCliente,
  );
  return await deleteDoc(clienteRef);
};
