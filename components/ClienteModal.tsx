import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ClienteModal({ visible, onClose, onSave, clienteParaEditar }: any) {
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelWhatsapp, setResponsavelWhatsapp] = useState('');
  const [alunoNome, setAlunoNome] = useState('');
  const [alunoEscola, setAlunoEscola] = useState('');

  // Preenche os dados usando as CHAVES EXATAS da base de dados
  useEffect(() => {
    if (visible) {
      if (clienteParaEditar) {
        setResponsavelNome(clienteParaEditar.responsavel_nome || '');
        setResponsavelWhatsapp(clienteParaEditar.responsavel_whatsapp || '');
        setAlunoNome(clienteParaEditar.aluno_nome || '');
        setAlunoEscola(clienteParaEditar.aluno_escola || '');
      } else {
        setResponsavelNome('');
        setResponsavelWhatsapp('');
        setAlunoNome('');
        setAlunoEscola('');
      }
    }
  }, [visible, clienteParaEditar]);

  const handleSalvar = () => {
    if (!responsavelNome || !responsavelWhatsapp) {
      alert("Por favor, preencha o Nome e o WhatsApp do Responsável.");
      return;
    }

    // Guarda usando as CHAVES EXATAS
    onSave({
      responsavel_nome: responsavelNome,
      responsavel_whatsapp: responsavelWhatsapp,
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
            <TextInput style={styles.input} value={responsavelWhatsapp} onChangeText={setResponsavelWhatsapp} placeholder="Ex: 88996772144" keyboardType="phone-pad" />

            <Text style={styles.label}>Nome do Aluno(a)</Text>
            <TextInput style={styles.input} value={alunoNome} onChangeText={setAlunoNome} placeholder="Ex: Joãozinho" />
            
            <Text style={styles.label}>Escola</Text>
            <TextInput style={styles.input} value={alunoEscola} onChangeText={setAlunoEscola} placeholder="Ex: Escola Frei Damião" />

            <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
              <Text style={styles.saveButtonText}>{clienteParaEditar ? 'Guardar Alterações' : 'Guardar Cliente'}</Text>
            </TouchableOpacity>
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 4 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
  saveButton: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});