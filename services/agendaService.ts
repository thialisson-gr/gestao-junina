import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { appId } from "../firebaseConfig";

const getRef = () => {
  const db = getFirestore();
  return collection(
    db,
    "artifacts",
    String(appId || "gestao-junina-loja"),
    "public",
    "data",
    "alugueres",
  );
};

export const escutarAlugueres = (callback: any, errorCallback: any) => {
  const q = query(getRef());
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
  return await addDoc(getRef(), {
    ...dados,
    criado_em: serverTimestamp(),
    status: "Pendente",
  });
};

export const atualizarAluguer = async (id: string, dados: any) => {
  const db = getFirestore();
  const docRef = doc(db, getRef().path, id);
  return await updateDoc(docRef, dados);
};

export const excluirAluguer = async (id: string) => {
  const db = getFirestore();
  const docRef = doc(db, getRef().path, id);
  return await deleteDoc(docRef);
};
