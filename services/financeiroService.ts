import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Adicionar uma nova retirada
export const adicionarDespesa = async (dados: any) => {
  try {
    const docRef = await addDoc(collection(db, "despesas"), dados);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar despesa:", error);
    throw error;
  }
};

// Escutar as retiradas em tempo real
export const escutarDespesas = (
  callback: (dados: any[]) => void,
  errorCallback: (erro: any) => void,
) => {
  const q = query(collection(db, "despesas"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot: any) => {
      const despesas = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(despesas);
    },
    (error: any) => {
      errorCallback(error);
    },
  );

  return unsubscribe;
};

// Excluir uma retirada (caso tenha registado por engano)
export const excluirDespesa = async (id: string) => {
  try {
    await deleteDoc(doc(db, "despesas", id));
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    throw error;
  }
};
