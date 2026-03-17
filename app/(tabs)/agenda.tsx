import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AgendaCard from '../../components/AgendaCard';
import AluguerModal from '../../components/AluguerModal';
import { adicionarAluguer, atualizarAluguer, escutarAlugueres, excluirAluguer } from '../../services/agendaService';

const parseDataBR = (dataStr: string) => {
  if(!dataStr || typeof dataStr !== 'string' || !dataStr.includes('/')) return new Date();
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

export default function AgendaScreen() {
  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [aluguerParaEditar, setAluguerParaEditar] = useState<any>(null);

  const [abaAtiva, setAbaAtiva] = useState('Todos');
  const abas = ['Todos', 'Pendente', 'Entregue', 'Devolvido', 'Atrasado'];

  const [modalOpcoesVisible, setModalOpcoesVisible] = useState(false);
  const [aluguerSelecionado, setAluguerSelecionado] = useState<any>(null);

  const [modalMultaVisible, setModalMultaVisible] = useState(false);
  const [valorMulta, setValorMulta] = useState('');
  const [statusMulta, setStatusMulta] = useState('Pendente');

  useEffect(() => {
    const unsub = escutarAlugueres(
      (dados: any[]) => { setAlugueres(dados || []); setLoading(false); },
      (erro: any) => { console.log(erro); setLoading(false); }
    );
    return () => { if(unsub) unsub(); };
  }, []);

  const handleOpcoesAluguer = (item: any) => {
    if(!item || !item.id) return;
    setAluguerSelecionado(item);
    setModalOpcoesVisible(true);
  };

  const confirmarExclusao = (id: string) => {
    if(!id) return;
    Alert.alert("Atenção", "Tem a certeza que deseja apagar?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", style: "destructive", onPress: () => excluirAluguer(id) }
    ]);
  };

  const abrirModalMulta = (item: any) => {
    if(!item) return;
    setValorMulta(item?.valor_multa ? String(item.valor_multa.toFixed(2)).replace('.', ',') : '');
    setStatusMulta(item?.status_multa || 'Pendente');
    setModalMultaVisible(true);
  };

  const salvarMulta = async () => {
    if(!aluguerSelecionado?.id) return;
    const numMulta = Number(valorMulta.replace(/\D/g, '')) / 100; 
    
    const dadosAtualizados: any = {
      valor_multa: numMulta || 0,
      status_multa: statusMulta
    };

    // 👇 O CARIMBO DO CAIXA: Se marcou como recebida agora, guarda a data de hoje!
    if (statusMulta === 'Recebida' && aluguerSelecionado.status_multa !== 'Recebida') {
      dadosAtualizados.data_recebimento_multa = new Date().toISOString();
    }

    await atualizarAluguer(aluguerSelecionado.id, dadosAtualizados);
    setModalMultaVisible(false);
  };

  const abrirWhatsApp = () => {
    const telefone = aluguerSelecionado?.cliente_telefone;
    const nome = aluguerSelecionado?.cliente_nome;
    const pecasNome = aluguerSelecionado?.kit_nome || '';

    if (!telefone) {
      Alert.alert("Sem Número 📱", "Não guardámos o telefone deste cliente neste aluguer.");
      return;
    }

    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) { numeroLimpo = `55${numeroLimpo}`; }

    // 👇 Transforma "Peça 1, Peça 2" em uma lista com emojis
    const listaPecas = pecasNome.split(', ').map((p: string) => `🔸 ${p}`).join('\n');

    let mensagem = `Olá ${nome}! Tudo bem? Passando para avisar sobre o seu aluguel das seguintes peças:\n\n${listaPecas}\n\n...`;
    
    if (aluguerSelecionado.status === 'Pendente') {
      mensagem = `Olá ${nome}! Tudo bem? As suas peças já estão separadas e prontas para serem retiradas connosco! 👗✨\n\n${listaPecas}`;
    } else if (aluguerSelecionado.status === 'Entregue') {
      mensagem = `Olá ${nome}! Tudo bem? Apenas um lembrete amigável de que a devolução das suas peças está marcada para o dia *${aluguerSelecionado.data_devolucao}*.\n\n${listaPecas}\n\nQualquer dúvida, estamos à disposição! 🗓️`;
    }

    const url = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
    Linking.canOpenURL(url).then(suportado => {
      if (!suportado) { Alert.alert("Erro", "O WhatsApp não parece estar instalado."); } 
      else { return Linking.openURL(url); }
    }).catch(err => console.error('Erro ao abrir o WhatsApp', err));
  };

  // 👇 NOVA FUNÇÃO: Mensagem automática de responsabilidade na entrega
  const enviarMensagemCuidados = (aluguer: any) => {
    const telefone = aluguer?.cliente_telefone;
    if (!telefone) return;

    Alert.alert(
      "Peças Entregues! ✅",
      "Deseja enviar a mensagem de regras para o WhatsApp do cliente agora?",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim, Enviar", onPress: () => {
            let numeroLimpo = telefone.replace(/\D/g, '');
            if (numeroLimpo.length <= 11) { numeroLimpo = `55${numeroLimpo}`; }
            
            // 👇 Formata também a mensagem de cuidados
            const listaPecas = (aluguer.kit_nome || '').split(', ').map((p: string) => `🔸 ${p}`).join('\n');
            
            const mensagem = `Olá ${aluguer.cliente_nome}! 🎉\n\nConfirmamos a entrega dos seguintes itens para o seu evento:\n\n${listaPecas}\n\nLembramos que os itens estão sob a sua responsabilidade. Pedimos muito cuidado com manchas, rasgos ou queimaduras para evitarmos a cobrança de multas, combinado? 😉\n\nA sua devolução está marcada para o dia *${aluguer.data_devolucao}*. Bom evento! 🌵✨`;
            
            const url = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
            Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o WhatsApp."));
        }}
      ]
    );
  };

  const alugueresFiltrados = (alugueres || [])
    .filter(item => {
      if (!item || !item?.id) return false;
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const estaAtrasado = item.status !== 'Devolvido' && item.data_devolucao && parseDataBR(item.data_devolucao) < hoje;

      if (abaAtiva === 'Todos') return true;
      if (abaAtiva === 'Atrasado') return estaAtrasado;
      return item.status === abaAtiva;
    })
    .sort((a, b) => {
      // 👇 ORDENAÇÃO: Coloca os mais recentes no topo
      // O Firebase pode guardar a data como Timestamp ou texto (ISO), por isso tratamos os dois casos
      const tempoA = a.criado_em?.seconds ? a.criado_em.seconds * 1000 : new Date(a.criado_em || 0).getTime();
      const tempoB = b.criado_em?.seconds ? b.criado_em.seconds * 1000 : new Date(b.criado_em || 0).getTime();
      
      return tempoB - tempoA; // Do maior (mais recente) para o menor (mais antigo)
    });

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const selecionadoEstaAtrasado = aluguerSelecionado && aluguerSelecionado?.status !== 'Devolvido' && aluguerSelecionado?.data_devolucao && parseDataBR(aluguerSelecionado.data_devolucao) < hoje;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda de Aluguéis</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={() => {
          setAluguerParaEditar(null);
          setModalVisible(true);
        }}>
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {abas.map(aba => (
            <TouchableOpacity key={aba} style={[styles.tabButton, abaAtiva === aba && styles.tabButtonActive]} onPress={() => setAbaAtiva(aba)}>
              <Text style={[styles.tabText, abaAtiva === aba && styles.tabTextActive]}>{aba}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          {alugueresFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma peça no status "{abaAtiva}".</Text>
          ) : (
            alugueresFiltrados.map(item => (
              <AgendaCard key={item?.id || Math.random().toString()} item={item} onPressOpcoes={() => handleOpcoesAluguer(item)} /> 
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <AluguerModal 
        visible={modalVisible} 
        aluguerParaEditar={aluguerParaEditar}
        onClose={() => {
          setModalVisible(false);
          setAluguerParaEditar(null);
        }} 
        onSave={async (d: any) => { 
          if(d.id) {
            await atualizarAluguer(d.id, d);
          } else {
            await adicionarAluguer(d);
          }
          setModalVisible(false); 
          setAluguerParaEditar(null);
        }} 
        alugueresExistentes={alugueres || []} 
      />

      {/* MODAL DE GERENCIAMENTO (OPÇÕES) */}
      <Modal visible={modalOpcoesVisible} transparent animationType="slide">
        <View style={styles.modalBgBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.modalDragHandle} />
            
            <Text style={styles.modalTitleOpcoes}>Gerenciar Aluguel</Text>
            <Text style={styles.modalSubOpcoes}>
              {aluguerSelecionado?.cliente_nome} • {aluguerSelecionado?.kit_nome}
            </Text>

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fff7ed', borderColor: '#fed7aa', marginBottom: 15 }]} onPress={() => { setModalOpcoesVisible(false); setAluguerParaEditar(aluguerSelecionado); setModalVisible(true); }}>
              <Text style={[styles.btnMenuText, { color: '#ea580c', fontWeight: 'bold' }]}>✏️ Editar Dados do Aluguel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', marginBottom: 15 }]} onPress={() => { setModalOpcoesVisible(false); abrirWhatsApp(); }}>
              <Text style={[styles.btnMenuText, { color: '#16a34a', fontWeight: 'bold' }]}>💬 Avisar no WhatsApp</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitleOpcoes}>Alterar Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
              
              {/* 👇 TRAVA DE ATRASO: Pendente */}
              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (selecionadoEstaAtrasado) {
                  Alert.alert("Ação Inválida 🚫", "Esta peça já está Atrasada. Não é possível voltar o status para 'Pendente'.");
                  return;
                }
                if(aluguerSelecionado?.id) atualizarAluguer(aluguerSelecionado.id, { status: 'Pendente' }); 
                setModalOpcoesVisible(false); 
              }}>
                <Text style={styles.btnMenuText}>Pendente</Text>
              </TouchableOpacity>
              
              {/* 👇 TRAVA DE ATRASO: Entregue */}
              {/* 👇 TRAVA DE ATRASO E CARIMBO REAL: Entregue */}
              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (aluguerSelecionado?.status === 'Entregue') {
                  Alert.alert("Aviso", "Esta peça já consta como Entregue ao cliente.");
                  return;
                }

                if(aluguerSelecionado?.id) {
                  atualizarAluguer(aluguerSelecionado.id, { 
                    status: 'Entregue',
                    data_entrega_real: new Date().toISOString() 
                  }); 
                  setModalOpcoesVisible(false);
                  enviarMensagemCuidados(aluguerSelecionado);
                }
              }}>
                <Text style={styles.btnMenuText}>Entregue</Text>
              </TouchableOpacity>

              {/* 👇 TRAVA DE PENDENTE E CARIMBO REAL: Devolvido */}
              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (aluguerSelecionado?.status === 'Pendente') {
                  Alert.alert(
                    "Ação Inválida 🚫", 
                    "Este aluguel consta como 'Pendente' (a peça nunca saiu da loja).\n\nSe o cliente não veio buscar no dia combinado, você deve EXCLUIR ou EDITAR este aluguel para liberar a peça para novos clientes."
                  );
                  return;
                }

                if(aluguerSelecionado?.id) {
                  const listaPecas = (aluguerSelecionado?.kit_nome || '').split(', ').map((p: string) => `🔸 ${p}`).join('\n');
                  
                  Alert.alert(
                    "Conferência de Devolução 📦",
                    `Confirme se TODAS as peças abaixo estão a ser devolvidas:\n\n${listaPecas}`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Sim, Receber Tudo", onPress: () => {
                          atualizarAluguer(aluguerSelecionado.id, { 
                            status: 'Devolvido',
                            data_devolucao_real: new Date().toISOString()
                          }); 
                          setModalOpcoesVisible(false);
                      }}
                    ]
                  );
                }
              }}>
                <Text style={styles.btnMenuText}>Devolvido</Text>
              </TouchableOpacity>
            </View>

            {(selecionadoEstaAtrasado || (aluguerSelecionado?.valor_multa && aluguerSelecionado.valor_multa > 0)) && (
              <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', marginBottom: 15 }]} onPress={() => { setModalOpcoesVisible(false); abrirModalMulta(aluguerSelecionado); }}>
                <Text style={[styles.btnMenuText, { color: '#dc2626', fontWeight: 'bold' }]}>💰 Aplicar/Receber Multa</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginTop: 10 }]} onPress={() => { setModalOpcoesVisible(false); if(aluguerSelecionado?.id) confirmarExclusao(aluguerSelecionado.id); }}>
              <Text style={[styles.btnMenuText, { color: '#dc2626' }]}>🗑️ Cancelar / Excluir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalOpcoesVisible(false)} style={{ marginTop: 20, padding: 10 }}>
              <Text style={{ color: '#6b7280', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Fechar Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMultaVisible} transparent animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.modalContentCenter}>
            <Text style={styles.modalTitleCenter}>Gerenciar Multa</Text>
            <Text style={{marginBottom: 16, color: '#6b7280', textAlign: 'center'}}>{aluguerSelecionado?.cliente_nome}</Text>

            <TextInput style={styles.inputCenter} placeholder="Valor da Multa (R$)" keyboardType="numeric" value={valorMulta} onChangeText={(t) => setValorMulta(t.replace(/\D/g, '').replace(/(\d)(\d{2})$/, '$1,$2'))} />
            <View style={styles.pickerContainer}>
              <Picker selectedValue={statusMulta} onValueChange={setStatusMulta} style={{height: 50}}>
                <Picker.Item label="Pendente (Por Receber)" value="Pendente" />
                <Picker.Item label="Recebida no Caixa" value="Recebida" />
                <Picker.Item label="Cancelada / Perdoada" value="Cancelada" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.btnSalvarCenter} onPress={salvarMulta}>
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Salvar Multa</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalMultaVisible(false)} style={{marginTop: 15, padding: 10}}>
              <Text style={{color: '#ef4444', textAlign: 'center', fontWeight: 'bold'}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  btnAdd: { backgroundColor: '#ea580c', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { backgroundColor: '#fff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabsScroll: { paddingHorizontal: 20, gap: 10 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabButtonActive: { backgroundColor: '#ea580c' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 16 },
  
  // MODAL DE BAIXO (OPÇÕES)
  modalBgBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentBottom: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalDragHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitleOpcoes: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalSubOpcoes: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  sectionTitleOpcoes: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, marginTop: 10 },
  btnMenu: { borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  btnMenuText: { fontSize: 15, color: '#374151', fontWeight: '600' },

  // MODAL DE CENTRO (MULTA)
  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContentCenter: { backgroundColor: '#fff', padding: 24, borderRadius: 20 },
  modalTitleCenter: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  inputCenter: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', padding: 14, borderRadius: 12, marginBottom: 15, fontSize: 16, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  btnSalvarCenter: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center' },
});