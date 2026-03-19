import {
  addDoc,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, GAVETAS, getGaveta } from "../firebaseConfig"; // 👈 Importamos o auth direto do Firebase

// ----------------------------------------------------
// ACERVO (KITS)
// ----------------------------------------------------
export const escutarKits = (callback: any, errorCallback: any) => {
  const q = query(getGaveta(GAVETAS.ACERVO));
  return onSnapshot(
    q,
    (snapshot: any) =>
      callback(
        snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ),
    errorCallback,
  );
};

export const adicionarKit = async (dados: any) => {
  return await addDoc(getGaveta(GAVETAS.ACERVO), {
    ...dados,
    criado_em: new Date().toISOString(),
  });
};

export const atualizarKit = async (id: string, dados: any) =>
  await updateDoc(
    doc(getFirestore(), getGaveta(GAVETAS.ACERVO).path, id),
    dados,
  );

export const excluirKit = async (id: string) =>
  await deleteDoc(doc(getFirestore(), getGaveta(GAVETAS.ACERVO).path, id));

// ----------------------------------------------------
// AGENDA (ALUGUERES) - COM AUDITORIA AUTOMÁTICA
// ----------------------------------------------------
export const escutarAlugueres = (callback: any, errorCallback: any) => {
  const q = query(getGaveta(GAVETAS.AGENDA));
  return onSnapshot(
    q,
    (snapshot: any) =>
      callback(
        snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ),
    errorCallback,
  );
};

export const adicionarAluguer = async (dados: any) => {
  // 1. Puxamos quem está logado diretamente da fonte!
  const emailOperador = auth.currentUser?.email || "Desconhecido";
  const agora = new Date().toISOString();

  // 2. Injetamos com força bruta antes de salvar
  return await addDoc(getGaveta(GAVETAS.AGENDA), {
    ...dados,
    criado_por: emailOperador,
    criado_em: agora,
    atualizado_por: emailOperador,
    atualizado_em: agora,
  });
};

export const atualizarAluguer = async (id: string, dados: any) => {
  const emailOperador = auth.currentUser?.email || "Desconhecido";
  const agora = new Date().toISOString();

  // 1. Preparamos os dados base da atualização
  const payload: any = {
    ...dados,
    atualizado_por: emailOperador,
    atualizado_em: agora,
  };

  // 👇 2. A MÁGICA DA AUDITORIA:
  // O Serviço interceta a mudança de status e carimba a ação específica!
  if (dados.status === "Entregue") {
    payload.entregue_por = emailOperador; // Quem entregou e recebeu o dinheiro
  } else if (dados.status === "Devolvido") {
    payload.devolvido_por = emailOperador; // Quem conferiu a peça no retorno
  }

  // 3. Envia para a base de dados
  return await updateDoc(
    doc(getFirestore(), getGaveta(GAVETAS.AGENDA).path, id),
    payload,
  );
};

export const excluirAluguer = async (id: string) => {
  return await deleteDoc(
    doc(getFirestore(), getGaveta(GAVETAS.AGENDA).path, id),
  );
};
