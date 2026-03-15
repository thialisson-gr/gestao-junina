import React, { useEffect, useState } from 'react';
// 1. Adicionados TextInput e ActivityIndicator aqui nas importações
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ClienteCard from '../../components/ClienteCard';
import ClienteModal from '../../components/ClienteModal';
import { auth } from '../../firebaseConfig';

// Verifique se o seu ficheiro em services se chama 'clientesService' ou 'clienteService' (com ou sem 's')
import { adicionarCliente, atualizarCliente, escutarClientes, excluirCliente } from '../../services/clienteService';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<any>(null);

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
            // Nova confirmação de segurança antes de apagar
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={{ flex: 1 }} placeholder="Pesquisar..." />
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1, padding: 24 }}>
          {clientes.map(cliente => (
            <ClienteCard 
              key={cliente.id} 
              cliente={cliente} 
              onPressWhatsApp={() => {/* sua função de whatsapp */}} 
              onPressOptions={() => handleOpcoesCliente(cliente)} // <--- ESTA LINHA É A CHAVE
            />
          ))}
        </ScrollView>
      )}

      {/* 3. O Modal está agora no sítio certo, dentro do return */}
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
// 4. O bloco perdido que estava aqui foi apagado!

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  btnAdd: { width: 44, height: 44, backgroundColor: '#ea580c', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});