import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function KitModal({ visible, onClose, onSave, kitParaEditar }: any) {
  const [idEtiqueta, setIdEtiqueta] = useState('');
  const [personagem, setPersonagem] = useState('');
  const [anoTema, setAnoTema] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  
  // NOVO ESTADO: O Status Interno da Peça
  const [statusInterno, setStatusInterno] = useState('Disponível');

  useEffect(() => {
    if (visible) {
      if (kitParaEditar) {
        setIdEtiqueta(kitParaEditar.id_etiqueta || '');
        setPersonagem(kitParaEditar.personagem || '');
        setAnoTema(kitParaEditar.ano_tema || '');
        setGenero(kitParaEditar.genero || 'Masculino');
        setImagemUri(kitParaEditar.imagem_url || null);
        // Traz o status antigo (ou assume Disponível se for uma peça antiga sem status)
        setStatusInterno(kitParaEditar.status_interno || 'Disponível');
      } else {
        setIdEtiqueta('');
        setPersonagem('');
        setAnoTema('');
        setGenero('Masculino');
        setImagemUri(null);
        setStatusInterno('Disponível');
      }
    }
  }, [visible, kitParaEditar]);

  const escolherImagem = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.1, 
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fotoBase64 = result.assets[0].base64;
        if (fotoBase64) {
          const imagemEmTexto = `data:image/jpeg;base64,${fotoBase64}`;
          setImagemUri(imagemEmTexto); 
        }
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      alert("Ocorreu um erro ao tentar usar esta fotografia.");
    }
  };

  const handleSalvar = () => {
    if (!idEtiqueta || !personagem) {
      alert("Por favor, preencha o ID e o Personagem.");
      return;
    }

    onSave({
      id_etiqueta: idEtiqueta,
      personagem: personagem,
      ano_tema: anoTema,
      genero: genero,
      imagem_url: imagemUri, 
      // Salva o novo status na base de dados
      status_interno: statusInterno
    });
  };

  // Função para dar a cor certa aos botões de status
  const getStatusStyle = (status: string) => {
    if (statusInterno !== status) return styles.radioBtn;
    if (status === 'Disponível') return [styles.radioBtn, { backgroundColor: '#22c55e', borderColor: '#22c55e' }]; // Verde
    if (status === 'Lavandaria') return [styles.radioBtn, { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }]; // Azul
    if (status === 'Costureira') return [styles.radioBtn, { backgroundColor: '#ef4444', borderColor: '#ef4444' }]; // Vermelho
    return styles.radioBtn;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{kitParaEditar ? 'Editar Kit' : 'Novo Kit'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity style={styles.imagePickerButton} onPress={escolherImagem}>
              {imagemUri ? (
                <Image source={{ uri: imagemUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color="#9ca3af" />
                  <Text style={styles.imagePlaceholderText}>Adicionar Foto da Peça</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>ID da Etiqueta *</Text>
            <TextInput style={styles.input} value={idEtiqueta} onChangeText={setIdEtiqueta} placeholder="Ex: KIT-MASC-001" />

            <Text style={styles.label}>Personagem *</Text>
            <TextInput style={styles.input} value={personagem} onChangeText={setPersonagem} placeholder="Ex: Noivo, Lampião..." />

            <Text style={styles.label}>Ano / Tema</Text>
            <TextInput style={styles.input} value={anoTema} onChangeText={setAnoTema} placeholder="Ex: 2024 - Sertão" />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.row}>
              {['Masculino', 'Feminino', 'Acessório'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.radioBtn, genero === cat && styles.radioBtnActive]}
                  onPress={() => setGenero(cat)}
                >
                  <Text style={[styles.radioText, genero === cat && styles.radioTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ========================================== */}
            {/* NOVA SECÇÃO: STATUS INTERNO DA PEÇA        */}
            {/* ========================================== */}
            <Text style={styles.label}>Status da Peça (Manutenção)</Text>
            <View style={styles.row}>
              {['Disponível', 'Lavandaria', 'Costureira'].map((status) => (
                <TouchableOpacity 
                  key={status} 
                  style={getStatusStyle(status)}
                  onPress={() => setStatusInterno(status)}
                >
                  <Text style={[styles.radioText, statusInterno === status && styles.radioTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
              <Text style={styles.saveButtonText}>{kitParaEditar ? 'Guardar Alterações' : 'Guardar Peça'}</Text>
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
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 4 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  radioBtnActive: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  radioText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  radioTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePickerButton: { width: '100%', height: 200, backgroundColor: '#f3f4f6', borderRadius: 16, overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  imagePlaceholderText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});