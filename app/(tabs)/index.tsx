import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // 👈 Adicionado para as multas
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AluguerModal from '../../components/AluguerModal';
import { auth } from '../../firebaseConfig';
import { adicionarAluguer, atualizarAluguer, escutarAlugueres, excluirAluguer } from '../../services/agendaService';
import { useAuth } from '../_layout';

const parseDataBR = (dataStr: string) => {
  if (!dataStr || typeof dataStr !== 'string' || !dataStr.includes('/')) return new Date(0);
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

const getHojeStr = () => {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter(); 
  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal de Edição (Formulário)
  const [modalVisible, setModalVisible] = useState(false);
  const [aluguerParaEditar, setAluguerParaEditar] = useState<any>(null);

  // 👇 NOVOS ESTADOS: Para o Menu de Gerenciar e Multas
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

  // ==========================================
  // 👇 FUNÇÕES DO MENU GERENCIAR (Trazidas da Agenda)
  // ==========================================
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
            
            const listaPecas = (aluguer.kit_nome || '').split(', ').map((p: string) => `🔸 ${p}`).join('\n');
            
            const mensagem = `Olá ${aluguer.cliente_nome}! 🎉\n\nConfirmamos a entrega dos seguintes itens para o seu evento:\n\n${listaPecas}\n\nLembramos que os itens estão sob a sua responsabilidade. Pedimos muito cuidado com manchas, rasgos ou queimaduras para evitarmos a cobrança de multas, combinado? 😉\n\nA sua devolução está marcada para o dia *${aluguer.data_devolucao}*. Bom evento! 🌵✨`;
            
            const url = `whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
            Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o WhatsApp."));
        }}
      ]
    );
  };

  // ==========================================
  // LÓGICA DE DADOS DO DASHBOARD
  // ==========================================
  const dataAtual = new Date();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dataFormatadaTexto = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]}, ${dataAtual.getFullYear()}`;

  const hojeStr = getHojeStr();
  const hojeObj = new Date();
  hojeObj.setHours(0, 0, 0, 0);

  // Variável auxiliar para a Multa no menu de Opções
  const selecionadoEstaAtrasado = aluguerSelecionado && aluguerSelecionado?.status !== 'Devolvido' && aluguerSelecionado?.data_devolucao && parseDataBR(aluguerSelecionado.data_devolucao) < hojeObj;

  let countEntregas = 0; let countDevolucoes = 0; let countAtrasados = 0; let countCostureira = 0;
  let agendaHoje: any[] = [];

  alugueres.forEach(alug => {
    const isDevolvido = alug.status === 'Devolvido';
    const isCancelado = alug.status === 'Cancelado';
    
    if (isDevolvido || isCancelado) return; 

    const dataDevObj = parseDataBR(alug.data_devolucao);
    let adicionadoNaAgenda = false;

    if (alug.medidas_costureira && alug.medidas_costureira.trim() !== '' && alug.status === 'Pendente') { countCostureira++; }

    if (dataDevObj < hojeObj) {
      countAtrasados++;
      agendaHoje.push({ ...alug, tipo: 'atraso', hora: 'Atrasado', aluno: alug.cliente_nome, kit: alug.kit_nome, concluido: false });
      adicionadoNaAgenda = true;
    }

    if (alug.data_retirada === hojeStr) {
      countEntregas++;
      if (!adicionadoNaAgenda) {
        const jaEntregue = alug.status === 'Entregue';
        agendaHoje.push({ ...alug, tipo: 'entrega', hora: jaEntregue ? '✅ Já Entregue' : 'Sai Hoje', aluno: alug.cliente_nome, kit: alug.kit_nome, concluido: jaEntregue });
        adicionadoNaAgenda = true;
      }
    }

    if (alug.data_devolucao === hojeStr) {
      countDevolucoes++;
      if (!adicionadoNaAgenda) {
        agendaHoje.push({ ...alug, tipo: 'devolucao', hora: 'Volta Hoje', aluno: alug.cliente_nome, kit: alug.kit_nome, concluido: false });
      }
    }
  });

  agendaHoje.sort((a, b) => {
    if (a.tipo === 'atraso' && b.tipo !== 'atraso') return -1;
    if (b.tipo === 'atraso' && a.tipo !== 'atraso') return 1;
    if (a.concluido && !b.concluido) return 1;
    if (!a.concluido && b.concluido) return -1;
    return 0;
  });

  const stats = [
    { id: 'entregas', label: 'Entregas Hoje', value: countEntregas.toString(), icon: 'arrow-up-circle', color: '#eff6ff', iconColor: '#1d4ed8' },
    { id: 'devolucoes', label: 'Devolv. Hoje', value: countDevolucoes.toString(), icon: 'arrow-down-circle', color: '#f0fdf4', iconColor: '#15803d' },
    { id: 'atrasos', label: 'Atrasados', value: countAtrasados.toString(), icon: 'alert-triangle', color: '#fef2f2', iconColor: '#b91c1c' },
    { id: 'costureira', label: 'Na Costureira', value: countCostureira.toString(), icon: 'scissors', color: '#faf5ff', iconColor: '#7e22ce' },
  ];

  return (
    <View style={styles.mainContainer}>
      <View style={styles.fixedHeader}>
        <View style={styles.brandContainer}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <View>
            <Text style={styles.logoTextName}>Nação Nordestina</Text>
            <Text style={styles.logoSubText}>Gestão de Acervo</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => {
            Alert.alert("Sair do Sistema", "Tem certeza que deseja desconectar a sua conta?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim, Sair", style: "destructive", onPress: async () => {
                    try {
                      await signOut(auth);
                    } catch (error: any) {
                      Alert.alert("Erro", "Não foi possível desconectar.");
                    }
                  } 
                }
              ]
            );
          }}
        >
          <Feather name="log-out" size={20} color="#ea580c" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 16 }}>
        
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ea580c' }]}
            onPress={() => { setAluguerParaEditar(null); setModalVisible(true); }}
          >
            <Feather name="plus-circle" size={28} color="#fff" />
            <Text style={styles.actionText}>Novo Aluguel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#111827' }]}
            onPress={() => router.push('/scanner' as any)}
          >
            <Feather name="maximize" size={28} color="#fff" />
            <Text style={styles.actionText}>Ler Etiqueta</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithDate}>
                <Text style={styles.sectionTitle}>Resumo do Dia</Text>
                <Text style={styles.dateText}>{dataFormatadaTexto}</Text>
              </View>

              <View style={styles.statsGrid}>
                {stats.map((stat) => (
                  <View key={stat.id} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={[styles.iconWrapper, { backgroundColor: stat.color }]}>
                        <Feather name={stat.icon as any} size={20} color={stat.iconColor} />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.agendaHeader}>
                <Text style={styles.sectionTitle}>Tarefas de Hoje</Text>
                <TouchableOpacity onPress={() => router.push('/agenda')}>
                  <Text style={styles.seeAllText}>Ver Agenda</Text>
                </TouchableOpacity>
              </View>
              
              {agendaHoje.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 10 }}>Nenhuma tarefa pendente para hoje. 🎉</Text>
              ) : (
                agendaHoje.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.agendaItem, item.concluido && { opacity: 0.6, backgroundColor: '#f9fafb' }]}
                    activeOpacity={0.7}
                    // 👇 AQUI ESTÁ A MUDANÇA: Agora abre o Gerenciar ao invés do Formulário!
                    onPress={() => handleOpcoesAluguer(item)}
                  >
                    <View style={[styles.agendaIcon, { 
                      backgroundColor: item.tipo === 'entrega' && !item.concluido ? '#eff6ff' : 
                                       item.tipo === 'entrega' && item.concluido ? '#dcfce7' : 
                                       item.tipo === 'devolucao' ? '#f0fdf4' : '#fef2f2' 
                    }]}>
                      <Feather 
                        name={item.concluido ? 'check-circle' : item.tipo === 'entrega' ? 'arrow-up-circle' : item.tipo === 'devolucao' ? 'arrow-down-circle' : 'alert-triangle'} 
                        size={20} 
                        color={item.concluido ? '#16a34a' : item.tipo === 'entrega' ? '#1d4ed8' : item.tipo === 'devolucao' ? '#15803d' : '#b91c1c'} 
                      />
                    </View>
                    
                    <View style={styles.agendaInfo}>
                      <Text style={[styles.agendaName, item.concluido && { textDecorationLine: 'line-through', color: '#6b7280' }]}>{item.aluno}</Text>
                      <Text style={styles.agendaKit} numberOfLines={1}>{item.kit}</Text>
                      
                      {item.medidas_costureira && item.medidas_costureira.trim() !== '' && !item.concluido && (
                        <View style={styles.badgeCostureira}>
                          <Feather name="scissors" size={12} color="#9333ea" />
                          <Text style={styles.badgeCostureiraText}>Ajustes Pendentes</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.agendaTime, { color: item.concluido ? '#16a34a' : item.tipo === 'atraso' ? '#b91c1c' : '#111827' }]}>
                      {item.hora}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL 1: FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */}
      <AluguerModal 
        visible={modalVisible} 
        aluguerParaEditar={aluguerParaEditar}
        onClose={() => { setModalVisible(false); setAluguerParaEditar(null); }} 
        onSave={async (d: any) => { 
          if(d.id) { await atualizarAluguer(d.id, d); } else { await adicionarAluguer(d); }
          setModalVisible(false); setAluguerParaEditar(null);
        }} 
        alugueresExistentes={alugueres || []} 
      />

      {/* 👇 MODAL 2: MENU DE GERENCIAR (O NOVO!) */}
      <Modal visible={modalOpcoesVisible} transparent animationType="slide">
        <View style={styles.modalBgBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.modalDragHandle} />
            
            <Text style={styles.modalTitleOpcoes}>Gerenciar Tarefa</Text>
            <Text style={styles.modalSubOpcoes}>
              {aluguerSelecionado?.cliente_nome} • {aluguerSelecionado?.kit_nome}
            </Text>

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#fff7ed', borderColor: '#fed7aa', marginBottom: 15 }]} 
              onPress={() => { setModalOpcoesVisible(false); setAluguerParaEditar(aluguerSelecionado); setModalVisible(true); }}>
              <Text style={[styles.btnMenuText, { color: '#ea580c', fontWeight: 'bold' }]}>✏️ Editar Dados do Aluguel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnMenu, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', marginBottom: 15 }]} 
              onPress={() => { setModalOpcoesVisible(false); abrirWhatsApp(); }}>
              <Text style={[styles.btnMenuText, { color: '#16a34a', fontWeight: 'bold' }]}>💬 Avisar no WhatsApp</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitleOpcoes}>Alterar Status Rápido</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
              
              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (selecionadoEstaAtrasado) {
                  Alert.alert("Ação Inválida 🚫", "Esta peça já está Atrasada. Não é possível voltar para 'Pendente'.");
                  return;
                }
                if(aluguerSelecionado?.id) atualizarAluguer(aluguerSelecionado.id, { status: 'Pendente' }); 
                setModalOpcoesVisible(false); 
              }}>
                <Text style={styles.btnMenuText}>Pendente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (aluguerSelecionado?.status === 'Entregue') {
                  Alert.alert("Aviso", "Esta peça já consta como Entregue ao cliente.");
                  return;
                }
                if(aluguerSelecionado?.id) {
                  atualizarAluguer(aluguerSelecionado.id, { status: 'Entregue', data_entrega_real: new Date().toISOString() }); 
                  setModalOpcoesVisible(false);
                  enviarMensagemCuidados(aluguerSelecionado);
                }
              }}>
                <Text style={styles.btnMenuText}>Entregue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btnMenu, { flex: 1, paddingVertical: 12 }]} onPress={() => { 
                if (aluguerSelecionado?.status === 'Pendente') {
                  Alert.alert("Ação Inválida 🚫", "Este aluguel consta como 'Pendente'. Exclua se o cliente não veio.");
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
                          atualizarAluguer(aluguerSelecionado.id, { status: 'Devolvido', data_devolucao_real: new Date().toISOString() }); 
                          setModalOpcoesVisible(false);
                      }}
                    ]
                  );
                }
              }}>
                <Text style={styles.btnMenuText}>Devolvido</Text>
              </TouchableOpacity>
            </View>

            {!!(selecionadoEstaAtrasado || (aluguerSelecionado?.valor_multa && aluguerSelecionado.valor_multa > 0)) && (
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

      {/* 👇 MODAL 3: MENU DE MULTAS */}
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
  mainContainer: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  fixedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, zIndex: 10 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 36, height: 36, marginRight: 12 },
  logoTextName: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  logoSubText: { fontSize: 11, fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: -2 },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
  sectionHeaderWithDate: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  quickActionsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 16 },
  actionButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionText: { color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  section: { paddingHorizontal: 24, marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  iconWrapper: { padding: 8, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  statLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { fontSize: 14, fontWeight: 'bold', color: '#ea580c' },
  agendaItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', marginBottom: 12 },
  agendaIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  agendaInfo: { flex: 1 },
  agendaName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  agendaKit: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  agendaTime: { fontSize: 12, fontWeight: 'bold' },
  badgeCostureira: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#faf5ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff', marginTop: 6 },
  badgeCostureiraText: { fontSize: 10, color: '#9333ea', marginLeft: 4, fontWeight: 'bold', textTransform: 'uppercase' },

  // 👇 NOVOS ESTILOS PARA OS MODAIS DE GERENCIAR E MULTA
  modalBgBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentBottom: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalDragHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitleOpcoes: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalSubOpcoes: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  sectionTitleOpcoes: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, marginTop: 10 },
  btnMenu: { borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  btnMenuText: { fontSize: 15, color: '#374151', fontWeight: '600' },

  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContentCenter: { backgroundColor: '#fff', padding: 24, borderRadius: 20 },
  modalTitleCenter: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  inputCenter: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', padding: 14, borderRadius: 12, marginBottom: 15, fontSize: 16, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  btnSalvarCenter: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center' },
});