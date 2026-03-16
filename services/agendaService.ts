import {
  addDoc,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { GAVETAS, getGaveta } from "../firebaseConfig";

export const escutarAlugueres = (callback: any, errorCallback: any) => {
  // Em vez de "alugueres", usamos a nossa variável constante e à prova de balas:
  const q = query(getGaveta(GAVETAS.AGENDA));

  return onSnapshot(
    q,
    (snapshot: any) => {
      const docs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(docs);
    },
    errorCallback,
  );
};

export const adicionarAluguer = async (dados: any) => {
  return await addDoc(getGaveta(GAVETAS.AGENDA), {
    ...dados,
    criado_em: serverTimestamp(),
    status: "Pendente",
  });
};

export const atualizarAluguer = async (id: string, dados: any) =>
  await updateDoc(doc(getFirestore(), getGaveta("alugueres").path, id), dados);

export const excluirAluguer = async (id: string) =>
  await deleteDoc(doc(getFirestore(), getGaveta("alugueres").path, id));
