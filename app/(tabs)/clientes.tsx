import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ClienteModal from '../../components/ClienteModal';
// Removida a importação do ClienteCard porque vamos desenhar o card CRM diretamente aqui
import { escutarAlugueres } from '../../services/agendaService';
import { adicionarCliente, atualizarCliente, escutarClientes, excluirCliente } from '../../services/clienteService';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [alugueres, setAlugueres] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<any>(null);
  
  const [busca, setBusca] = useState('');

  useEffect(() => {
    let carregados = 0;
    const checkLoading = () => { carregados++; if(carregados === 2) setLoading(false); };

    const unsubClientes = escutarClientes((d: any[]) => { setClientes(d); checkLoading(); }, (e: any) => checkLoading());
    const unsubAlugueres = escutarAlugueres((d: any[]) => { setAlugueres(d); checkLoading(); }, (e: any) => checkLoading());
    
    return () => { if(unsubClientes) unsubClientes(); if(unsubAlugueres) unsubAlugueres(); };
  }, []);

  const handleOpcoesCliente = (cliente: any) => {
    Alert.alert(
      "Opções do Cliente",
      `O que deseja fazer com ${cliente.responsavel_nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "✏️ Editar Cadastro",
          onPress: () => { setClienteEmEdicao(cliente); setModalVisible(true); }
        },
        { 
          text: "🗑️ Excluir Cliente", 
          style: "destructive", 
          onPress: () => {
            Alert.alert("Confirmar Exclusão", `Tem certeza que deseja excluir ${cliente.responsavel_nome}? Esta ação não pode ser desfeita.`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Sim, Excluir", style: "destructive", onPress: async () => {
                  try { await excluirCliente(cliente.id); } catch (e) { Alert.alert("Erro", "Não foi possível excluir."); }
              }}
            ]);
          } 
        }
      ]
    );
  };

  const abrirWhatsApp = (telefone: string, nome: string) => {
    if (!telefone) { Alert.alert("Sem Número", "Este cliente não tem telefone registado."); return; }
    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) { numeroLimpo = `55${numeroLimpo}`; }
    
    const url = `whatsapp://send?phone=${numeroLimpo}&text=Olá ${nome}! Tudo bem?`;
    Linking.openURL(url).catch(() => Alert.alert("Erro", "WhatsApp não parece estar instalado."));
  };

  const handleSalvarCliente = async (dadosCliente: any) => {
    try {
      if (clienteEmEdicao) { 
        await atualizarCliente(clienteEmEdicao.id, dadosCliente); 
      } else { 
        // 👇 CORREÇÃO DO ERRO 2554: Agora enviamos APENAS 1 argumento (os dados)
        await adicionarCliente(dadosCliente); 
      }
      setModalVisible(false); 
      setClienteEmEdicao(null); 
    } catch (error) { 
      Alert.alert("Erro", "Não foi possível salvar o cliente."); 
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    if (!busca) return true;
    const nomeDoCliente = (cliente.responsavel_nome || '').toLowerCase();
    return nomeDoCliente.includes(busca.toLowerCase());
  });

  const getDadosCRM = (clienteId: string) => {
    const historico = alugueres.filter(a => a.cliente_id === clienteId);
    let totalAlugueis = historico.length;
    let multasPendentes = 0;
    let pecasNaRua = 0;

    historico.forEach(alug => {
      if (alug.status === 'Pendente' || alug.status === 'Entregue' || alug.status === 'Atrasado') pecasNaRua++;
      if (alug.status_multa === 'Pendente') multasPendentes += (Number(alug.valor_multa) || 0);
    });

    return { totalAlugueis, multasPendentes, pecasNaRua };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes e Histórico</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={{ flex: 1, color: '#111827' }} placeholder="Buscar cliente por nome..." value={busca} onChangeText={setBusca} />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')}><Feather name="x-circle" size={18} color="#9ca3af" /></TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={() => { setClienteEmEdicao(null); setModalVisible(true); }}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {clientesFiltrados.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>Nenhum cliente encontrado.</Text>
          ) : (
            clientesFiltrados.map(cliente => {
              const crm = getDadosCRM(cliente.id);

              return (
                <View key={cliente.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(cliente.responsavel_nome || 'A')[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.nome} numberOfLines={1}>{cliente.responsavel_nome}</Text>
                      <Text style={styles.telefone}>{cliente.responsavel_whatsapp || 'Sem telefone'}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.btnAcao} onPress={() => abrirWhatsApp(cliente.responsavel_whatsapp, cliente.responsavel_nome)}>
                      <Feather name="message-circle" size={20} color="#16a34a" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAcao} onPress={() => handleOpcoesCliente(cliente)}>
                      <Feather name="settings" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.crmBox}>
                    <View style={styles.crmItem}>
                      <Text style={styles.crmValor}>{crm.totalAlugueis}</Text>
                      <Text style={styles.crmLabel}>Aluguéis</Text>
                    </View>
                    <View style={styles.crmItem}>
                      <Text style={[styles.crmValor, crm.pecasNaRua > 0 ? { color: '#ea580c' } : {}]}>{crm.pecasNaRua}</Text>
                      <Text style={styles.crmLabel}>Na Rua</Text>
                    </View>
                    <View style={styles.crmItem}>
                      <Text style={[styles.crmValor, crm.multasPendentes > 0 ? { color: '#dc2626' } : {}]}>
                        {crm.multasPendentes > 0 ? `R$${crm.multasPendentes.toFixed(2)}` : 'R$0'}
                      </Text>
                      <Text style={styles.crmLabel}>Multas</Text>
                    </View>
                  </View>

                  <Text style={styles.escolaText}>🏫 Aluno(a): {cliente.aluno_nome || 'N/A'} • {cliente.aluno_escola || 'N/A'}</Text>
                </View>
              );
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <ClienteModal visible={modalVisible} onClose={() => { setModalVisible(false); setClienteEmEdicao(null); }} onSave={handleSalvarCliente} clienteParaEditar={clienteEmEdicao} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  btnAdd: { width: 44, height: 44, backgroundColor: '#ea580c', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#ea580c' },
  cardInfo: { flex: 1 },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  telefone: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  btnAcao: { padding: 8, marginLeft: 4, backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  
  crmBox: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  crmItem: { flex: 1, alignItems: 'center' },
  crmValor: { fontSize: 16, fontWeight: '900', color: '#374151' },
  crmLabel: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginTop: 4 },
  
  escolaText: { fontSize: 13, color: '#4b5563', fontStyle: 'italic', backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, overflow: 'hidden' }
});