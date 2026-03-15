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

const getRef = () =>
  collection(
    getFirestore(),
    "artifacts",
    String(appId || "gestao-junina-loja"),
    "public",
    "data",
    "kits",
  );

export const escutarKits = (callback: any, errorCallback: any) => {
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

export const adicionarKit = async (dados: any) =>
  await addDoc(getRef(), { ...dados, criado_em: serverTimestamp() });
export const atualizarKit = async (id: string, dados: any) =>
  await updateDoc(doc(getFirestore(), getRef().path, id), dados);
export const excluirKit = async (id: string) =>
  await deleteDoc(doc(getFirestore(), getRef().path, id));
