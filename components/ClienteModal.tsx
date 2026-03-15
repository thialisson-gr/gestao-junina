import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ClienteModal({ visible, onClose, onSave, clienteParaEditar }: any) {
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelWhatsapp, setResponsavelWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [alunoNome, setAlunoNome] = useState('');
  const [alunoEscola, setAlunoEscola] = useState('');

  // Preenche os dados quando abrimos para Editar
  useEffect(() => {
    if (visible) {
      if (clienteParaEditar) {
        setResponsavelNome(clienteParaEditar.responsavel_nome || '');
        setResponsavelWhatsapp(clienteParaEditar.responsavel_whatsapp || '');
        setEndereco(clienteParaEditar.endereco || '');
        setAlunoNome(clienteParaEditar.aluno_nome || '');
        setAlunoEscola(clienteParaEditar.aluno_escola || '');
      } else {
        setResponsavelNome('');
        setResponsavelWhatsapp('');
        setEndereco('');
        setAlunoNome('');
        setAlunoEscola('');
      }
    }
  }, [visible, clienteParaEditar]);

  // 👇 MÁSCARA DE TELEFONE: Formata como (99) 9 9999-9999 enquanto digita
  const handleTelefoneChange = (texto: string) => {
    let limpo = texto.replace(/\D/g, '').substring(0, 11); // Tira letras, limita a 11 números
    
    let formatado = limpo;
    if (limpo.length > 2) {
      formatado = `(${limpo.substring(0, 2)}) ${limpo.substring(2)}`;
    }
    if (limpo.length > 3) {
      formatado = `(${limpo.substring(0, 2)}) ${limpo.substring(2, 3)} ${limpo.substring(3)}`;
    }
    if (limpo.length > 7) {
      formatado = `(${limpo.substring(0, 2)}) ${limpo.substring(2, 3)} ${limpo.substring(3, 7)}-${limpo.substring(7)}`;
    }
    
    setResponsavelWhatsapp(formatado);
  };

  const handleSalvar = () => {
    // 👇 VALIDAÇÃO: Agora TUDO é obrigatório!
    if (!responsavelNome || !responsavelWhatsapp || !endereco || !alunoNome || !alunoEscola) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    onSave({
      responsavel_nome: responsavelNome,
      responsavel_whatsapp: responsavelWhatsapp,
      endereco: endereco,
      aluno_nome: alunoNome,
      aluno_escola: alunoEscola,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nome do Responsável *</Text>
            <TextInput style={styles.input} value={responsavelNome} onChangeText={setResponsavelNome} placeholder="Ex: Maria Silva" />

            <Text style={styles.label}>WhatsApp *</Text>
            <TextInput 
              style={styles.input} 
              value={responsavelWhatsapp} 
              onChangeText={handleTelefoneChange} 
              placeholder="(88) 9 9999-9999" 
              keyboardType="numeric" 
            />

            <Text style={styles.label}>Endereço Completo *</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              value={endereco} 
              onChangeText={setEndereco} 
              multiline={true}
              placeholder="Rua, Número, Bairro, Cidade..." 
            />

            <Text style={styles.label}>Nome do Aluno(a) *</Text>
            <TextInput style={styles.input} value={alunoNome} onChangeText={setAlunoNome} placeholder="Ex: Joãozinho" />
            
            <Text style={styles.label}>Escola *</Text>
            <TextInput style={styles.input} value={alunoEscola} onChangeText={setAlunoEscola} placeholder="Ex: Escola Frei Damião" />

            {/* 👇 TEXTO DO BOTÃO ALTERADO */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
              <Text style={styles.saveButtonText}>
                {clienteParaEditar ? 'Atualizar Cadastro' : 'Salvar Cadastro'}
              </Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 4 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
  saveButton: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});