import {
  addDoc,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
} from "firebase/firestore";
import { auth, GAVETAS, getGaveta } from "../firebaseConfig"; // 👈 Importamos o auth

export const escutarDespesas = (callback: any, errorCallback: any) => {
  const q = query(getGaveta(GAVETAS.DESPESAS));
  return onSnapshot(
    q,
    (snapshot: any) =>
      callback(
        snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ),
    errorCallback,
  );
};

export const adicionarDespesa = async (dados: any) => {
  // Puxa o e-mail direto do motor do Firebase
  const emailOperador = auth.currentUser?.email || "Desconhecido";

  return await addDoc(getGaveta(GAVETAS.DESPESAS), {
    ...dados,
    operador: emailOperador, // 👈 O carimbo garantido
    criado_em: new Date().toISOString(),
  });
};

export const excluirDespesa = async (id: string) => {
  return await deleteDoc(
    doc(getFirestore(), getGaveta(GAVETAS.DESPESAS).path, id),
  );
};
