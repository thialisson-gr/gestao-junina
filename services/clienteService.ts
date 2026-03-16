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

// Escutar clientes em tempo real
export const escutarClientes = (callback: any, errorCallback: any) => {
  const q = query(getGaveta(GAVETAS.CLIENTES)); // 👈 Usando o GPS blindado!

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

// Adicionar um novo cliente
export const adicionarCliente = async (dados: any) => {
  return await addDoc(getGaveta(GAVETAS.CLIENTES), {
    ...dados,
    criado_em: serverTimestamp(),
  });
};

// Atualizar um cliente existente
export const atualizarCliente = async (id: string, dados: any) => {
  const db = getFirestore();
  const docRef = doc(db, getGaveta(GAVETAS.CLIENTES).path, id);
  return await updateDoc(docRef, dados);
};

// Excluir um cliente
export const excluirCliente = async (id: string) => {
  const db = getFirestore();
  const docRef = doc(db, getGaveta(GAVETAS.CLIENTES).path, id);
  return await deleteDoc(docRef);
};
