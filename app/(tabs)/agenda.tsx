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
  // 👇 NOVO ESTADO: Controla qual aluguer vai para o Modal de Edição
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
    await atualizarAluguer(aluguerSelecionado.id, {
      valor_multa: numMulta || 0,
      status_multa: statusMulta
    });
    setModalMultaVisible(false);
  };

  const abrirWhatsApp = () => {
    const telefone = aluguerSelecionado?.cliente_telefone;
    const nome = aluguerSelecionado?.cliente_nome;
    const peca = aluguerSelecionado?.kit_nome;

    if (!telefone) {
      Alert.alert("Sem Número 📱", "Não guardámos o telefone deste cliente neste aluguer. Terá de ver no cadastro de clientes.");
      return;
    }

    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) { numeroLimpo = `55${numeroLimpo}`; }

    let mensagem = `Olá ${nome}! Tudo bem? Passando para avisar sobre o seu aluguer da peça *${peca}*...`;
    
    if (aluguerSelecionado.status === 'Pendente') {
      mensagem = `Olá ${nome}! Tudo bem? A sua peça *${peca}* já está separada e pronta para ser retirada connosco! 👗✨`;
    } else if (aluguerSelecionado.status === 'Entregue') {
      mensagem = `Olá ${nome}! Tudo bem? Apenas um lembrete amigável de que a devolução da peça *${peca}* está marcada para o dia ${aluguerSelecionado.data_devolucao}. Qualquer dúvida, estamos à disposição! 🗓️`;
    }

    const url = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
    
    Linking.canOpenURL(url)
      .then(suportado => {
        if (!suportado) { Alert.alert("Erro", "O WhatsApp não parece estar instalado."); } 
        else { return Linking.openURL(url); }
      })
      .catch(err => console.error('Ocorreu um erro ao abrir o WhatsApp', err));
  };

  const alugueresFiltrados = (alugueres || []).filter(item => {
    if (!item || !item?.id) return false;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const estaAtrasado = item.status !== 'Devolvido' && item.data_devolucao && parseDataBR(item.data_devolucao) < hoje;

    if (abaAtiva === 'Todos') return true;
    if (abaAtiva === 'Atrasado') return estaAtrasado;
    return item.status === abaAtiva;
  });

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const selecionadoEstaAtrasado = aluguerSelecionado && aluguerSelecionado?.status !== 'Devolvido' && aluguerSelecionado?.data_devolucao && parseDataBR(aluguerSelecionado.data_devolucao) < hoje;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
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
        <ScrollView style={{ paddingHorizontal: 20, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
          {alugueresFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum registo em "{abaAtiva}".</Text>
          ) : (
            alugueresFiltrados.map(item => (
              <AgendaCard key={item?.id || Math.random().toString()} item={item} onPressOpcoes={() => handleOpcoesAluguer(item)} /> 
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* 👇 MODAL ATUALIZADO PARA SUPORTAR EDIÇÃO E SALVAR NO FIREBASE */}
      <AluguerModal 
        visible={modalVisible} 
        aluguerParaEditar={aluguerParaEditar}
        onClose={() => {
          setModalVisible(false);
          setAluguerParaEditar(null);
        }} 
        onSave={async (d: any) => { 
          if(d.id) {
            await atualizarAluguer(d.id, d); // Se tem ID, atualiza!
          } else {
            await adicionarAluguer(d); // Se não tem ID, cria um novo!
          }
          setModalVisible(false); 
          setAluguerParaEditar(null);
        }} 
        alugueresExistentes={alugueres || []} 
      />

      <Modal visible={modalOpcoesVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, {textAlign: 'center'}]}>Gerir Aluguer</Text>
            <Text style={{marginBottom: 20, color: '#6b7280', textAlign: 'center'}}>
              {aluguerSelecionado?.cliente_nome || 'Cliente Desconhecido'}{'\n'}Peça: {aluguerSelecionado?.kit_nome || 'Peça Desconhecida'}
            </Text>

            {/* 👇 NOVO BOTÃO: EDITAR ALUGUER */}
            <TouchableOpacity 
              style={[styles.btnMenu, { backgroundColor: '#fff7ed', borderColor: '#fed7aa', marginBottom: 15 }]} 
              onPress={() => { 
                setModalOpcoesVisible(false); // Fecha o menu de opções
                setAluguerParaEditar(aluguerSelecionado); // Passa os dados
                setModalVisible(true); // Abre o formulário de edição
              }}
            >
              <Text style={[styles.btnMenuText, { color: '#ea580c', fontWeight: 'bold' }]}>✏️ Editar Aluguer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', marginBottom: 15 }]} onPress={() => { setModalOpcoesVisible(false); abrirWhatsApp(); }}>
              <Text style={[styles.btnMenuText, { color: '#16a34a', fontWeight: 'bold' }]}>💬 Enviar WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnMenu} onPress={() => { if(aluguerSelecionado?.id) atualizarAluguer(aluguerSelecionado.id, { status: 'Pendente' }); setModalOpcoesVisible(false); }}>
              <Text style={styles.btnMenuText}>Mudar para: Pendente</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnMenu} onPress={() => { if(aluguerSelecionado?.id) atualizarAluguer(aluguerSelecionado.id, { status: 'Entregue' }); setModalOpcoesVisible(false); }}>
              <Text style={styles.btnMenuText}>Mudar para: Entregue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnMenu} onPress={() => { if(aluguerSelecionado?.id) atualizarAluguer(aluguerSelecionado.id, { status: 'Devolvido' }); setModalOpcoesVisible(false); }}>
              <Text style={styles.btnMenuText}>Mudar para: Devolvido</Text>
            </TouchableOpacity>

            {(selecionadoEstaAtrasado || (aluguerSelecionado?.valor_multa && aluguerSelecionado.valor_multa > 0)) ? (
              <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', marginTop: 10 }]} onPress={() => { setModalOpcoesVisible(false); abrirModalMulta(aluguerSelecionado); }}>
                <Text style={[styles.btnMenuText, { color: '#dc2626', fontWeight: 'bold' }]}>💰 Gerir Multa por Atraso</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginTop: 15 }]} onPress={() => { setModalOpcoesVisible(false); if(aluguerSelecionado?.id) confirmarExclusao(aluguerSelecionado.id); }}>
              <Text style={[styles.btnMenuText, { color: '#dc2626' }]}>🗑️ Excluir Aluguer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalOpcoesVisible(false)} style={{ marginTop: 15, padding: 10 }}>
              <Text style={{ color: '#6b7280', textAlign: 'center', fontWeight: 'bold' }}>Voltar / Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMultaVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gerir Multa de Atraso</Text>
            <Text style={{marginBottom: 10, color: '#6b7280'}}>Cliente: {aluguerSelecionado?.cliente_nome}</Text>

            <TextInput 
              style={styles.input} 
              placeholder="Valor da Multa (R$)" 
              keyboardType="numeric" 
              value={valorMulta} 
              onChangeText={(t) => setValorMulta(t.replace(/\D/g, '').replace(/(\d)(\d{2})$/, '$1,$2'))} 
            />

            <View style={styles.pickerContainer}>
              <Picker selectedValue={statusMulta} onValueChange={setStatusMulta} style={{height: 50}}>
                <Picker.Item label="Pendente (Por Receber)" value="Pendente" />
                <Picker.Item label="Recebida" value="Recebida" />
                <Picker.Item label="Cancelada / Perdoada" value="Cancelada" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.btnSalvar} onPress={salvarMulta}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Atualizar Multa</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalMultaVisible(false)} style={{marginTop: 15}}>
              <Text style={{color: 'red', textAlign: 'center'}}>Cancelar</Text>
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
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 12, fontSize: 16 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
  btnSalvar: { backgroundColor: '#ea580c', padding: 15, borderRadius: 10, alignItems: 'center' },
  
  btnMenu: { borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 8, marginBottom: 8, alignItems: 'center', backgroundColor: '#f9fafb' },
  btnMenuText: { fontSize: 16, color: '#111827', fontWeight: '500' },
});