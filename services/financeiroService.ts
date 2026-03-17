import {
  addDoc,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
} from "firebase/firestore";
import { GAVETAS, getGaveta } from "../firebaseConfig";

// Adicionar uma nova retirada
export const adicionarDespesa = async (dados: any) => {
  try {
    const docRef = await addDoc(getGaveta(GAVETAS.DESPESAS), dados);
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
  const q = query(getGaveta(GAVETAS.DESPESAS));

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

// Excluir uma retirada
export const excluirDespesa = async (id: string) => {
  try {
    const db = getFirestore();
    await deleteDoc(doc(db, getGaveta(GAVETAS.DESPESAS).path, id));
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    throw error;
  }
};
