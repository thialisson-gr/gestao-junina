import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ClienteCard from '../../components/ClienteCard';
import ClienteModal from '../../components/ClienteModal';
import { auth } from '../../firebaseConfig';
import { adicionarCliente, atualizarCliente, escutarClientes, excluirCliente } from '../../services/clienteService';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<any>(null);
  
  // 👇 NOVO ESTADO: Guarda o texto que você escreve na barra de busca
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const unsubscribe = escutarClientes(
      (dados: any[]) => { setClientes(dados); setLoading(false); },
      (erro: any) => { console.error("Erro:", erro); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  const handleOpcoesCliente = (cliente: any) => {
    Alert.alert(
      "Opções do Cliente",
      `O que deseja fazer com ${cliente.responsavel_nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Editar",
          onPress: () => {
            setClienteEmEdicao(cliente);
            setModalVisible(true);
          }
        },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: () => {
            Alert.alert(
              "Confirmar Exclusão",
              `Tem certeza que deseja excluir ${cliente.responsavel_nome}? Esta ação não pode ser desfeita.`,
              [
                { text: "Cancelar", style: "cancel" },
                { 
                  text: "Sim, Excluir", 
                  style: "destructive", 
                  onPress: async () => {
                    try {
                      await excluirCliente(cliente.id);
                    } catch (error) {
                      Alert.alert("Erro", "Não foi possível excluir o cliente.");
                    }
                  } 
                }
              ]
            );
          } 
        }
      ]
    );
  };

  const handleSalvarCliente = async (dadosCliente: any) => {
    try {
      if (clienteEmEdicao) {
        await atualizarCliente(clienteEmEdicao.id, dadosCliente);
      } else {
        await adicionarCliente(dadosCliente, auth.currentUser?.uid || 'anonimo');
      }
      setModalVisible(false);
      setClienteEmEdicao(null); 
    } catch (error) {
      alert("Erro ao salvar o cliente.");
    }
  };

  // 👇 A MÁGICA DA BUSCA: Filtra a lista antes de a desenhar na tela
  const clientesFiltrados = clientes.filter(cliente => {
    if (!busca) return true; // Se a busca estiver vazia, mostra todos
    const nomeDoCliente = (cliente.responsavel_nome || '').toLowerCase();
    return nomeDoCliente.includes(busca.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            {/* 👇 Liguei a barra de pesquisa ao estado "busca" */}
            <TextInput 
              style={{ flex: 1, color: '#111827' }} 
              placeholder="Pesquisar..." 
              value={busca}
              onChangeText={setBusca}
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')}>
                <Feather name="x-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={() => {
            setClienteEmEdicao(null);
            setModalVisible(true);
          }}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1, padding: 24 }}>
          {/* 👇 Agora o map só desenha os clientes que passaram no filtro */}
          {clientesFiltrados.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>Nenhum cliente encontrado.</Text>
          ) : (
            clientesFiltrados.map(cliente => (
              <ClienteCard 
                key={cliente.id} 
                cliente={cliente} 
                onPressWhatsApp={() => {/* função futura de whatsapp */}} 
                onPressOptions={() => handleOpcoesCliente(cliente)}
              />
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <ClienteModal 
        visible={modalVisible} 
        onClose={() => {
          setModalVisible(false);
          setClienteEmEdicao(null);
        }} 
        onSave={handleSalvarCliente} 
        clienteParaEditar={clienteEmEdicao} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  btnAdd: { width: 44, height: 44, backgroundColor: '#ea580c', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});