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
import { GAVETAS, getGaveta } from "../firebaseConfig"; // 👈 Importamos o GPS

export const escutarKits = (callback: any, errorCallback: any) => {
  const q = query(getGaveta(GAVETAS.ACERVO)); // 👈 Usamos a gaveta 'kits'
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

export const adicionarKit = async (dados: any) =>
  await addDoc(getGaveta(GAVETAS.ACERVO), {
    ...dados,
    criado_em: serverTimestamp(),
  });

export const atualizarKit = async (id: string, dados: any) =>
  await updateDoc(
    doc(getFirestore(), getGaveta(GAVETAS.ACERVO).path, id),
    dados,
  );

export const excluirKit = async (id: string) =>
  await deleteDoc(doc(getFirestore(), getGaveta(GAVETAS.ACERVO).path, id));
