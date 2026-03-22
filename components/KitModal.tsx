import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 👇 Adicionámos `kitsExistentes` aos parâmetros para podermos ler os anos já usados
export default function KitModal({ visible, onClose, onSave, kitParaEditar, kitsExistentes = [] }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [idEtiqueta, setIdEtiqueta] = useState('');
  const [personagem, setPersonagem] = useState('');
  const [anoTema, setAnoTema] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [categoria, setCategoria] = useState('Roupa');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [statusInterno, setStatusInterno] = useState('Ativo');
  
  const [isScanning, setIsScanning] = useState(false);
  
  // 👇 Novos estados para o Autocompletar do Ano/Coleção
  const [mostrarSugestoesAno, setMostrarSugestoesAno] = useState(false);
  const [anosTemasUnicos, setAnosTemasUnicos] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      if (kitParaEditar) {
        setIdEtiqueta(kitParaEditar.id_etiqueta || '');
        setPersonagem(kitParaEditar.personagem || '');
        setAnoTema(kitParaEditar.ano_tema || kitParaEditar.tema || '');
        setGenero(kitParaEditar.genero || 'Masculino');
        setCategoria(kitParaEditar.categoria || 'Roupa');
        setImagemUri(kitParaEditar.imagem_url || null);
        setStatusInterno(kitParaEditar.status_interno || 'Ativo');
      } else {
        setIdEtiqueta('');
        setPersonagem('');
        setAnoTema('');
        setGenero('Masculino');
        setCategoria('Roupa');
        setImagemUri(null);
        setStatusInterno('Ativo');
      }
      setIsScanning(false);
      setMostrarSugestoesAno(false);

      // 👇 Prepara a lista única de Anos/Temas para o Autocompletar
      if (kitsExistentes && kitsExistentes.length > 0) {
        const anosUnicos = [...new Set(kitsExistentes.map((k: any) => k.ano_tema || k.tema).filter((t: any) => t))] as string[];
        setAnosTemasUnicos(anosUnicos);
      }
    }
  }, [visible, kitParaEditar, kitsExistentes]);

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
    if (!idEtiqueta.trim() || !personagem.trim() || !anoTema.trim() || !genero || !categoria) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const codigoFormatado = idEtiqueta.trim().toUpperCase();

    // 👇 REGRA DE NEGÓCIO: Validação de Código Único
    const codigoJaExiste = kitsExistentes.find(
      (kit: any) => kit.id_etiqueta?.trim().toUpperCase() === codigoFormatado
    );

    // Se encontrou um código igual...
    if (codigoJaExiste) {
      // Se estamos a criar uma PEÇA NOVA, ou se estamos a editar mas o código pertence a OUTRA peça
      if (!kitParaEditar || (kitParaEditar && kitParaEditar.id !== codigoJaExiste.id)) {
        Alert.alert(
          "Código Duplicado 🚫", 
          `Já existe uma peça no acervo com a etiqueta "${codigoFormatado}" (${codigoJaExiste.personagem}). Por favor, digite um código diferente.`
        );
        return; // Pára a função aqui e não salva!
      }
    }

    onSave({
      id_etiqueta: codigoFormatado, // Salvamos sempre em maiúsculas para ficar padronizado
      personagem: personagem.trim(),
      ano_tema: anoTema.trim(),
      genero: genero,
      categoria: categoria,
      imagem_url: imagemUri, 
      status_interno: statusInterno
    });
  };

  const iniciarScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permissão negada", "Precisamos de acesso à câmara para ler o código.");
        return;
      }
    }
    setIsScanning(true);
  };

  // 👇 Filtra as sugestões com base no que a pessoa está a digitar
  const sugestoesFiltradasAno = anosTemasUnicos.filter(a => 
    a.toLowerCase().includes(anoTema.toLowerCase()) && a !== anoTema
  );

  if (isScanning) {
    return (
      <Modal visible={visible} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={({ data }) => {
              setIdEtiqueta(data);
              setIsScanning(false);
            }}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"] }}
          />
          <View style={{ position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 }}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
              Aponte para a Etiqueta
            </Text>
            <View style={{ width: 48 }} />
          </View>
          <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -125 }, { translateY: -125 }], width: 250, height: 250, borderWidth: 2, borderColor: '#ea580c', borderRadius: 24 }} />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{kitParaEditar ? 'Editar Peça' : 'Nova Peça'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true} // 👈 ADICIONE ISTO AQUI
          >
            
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { marginTop: 0 }]}>Código da Etiqueta *</Text>
                <TextInput style={styles.input} value={idEtiqueta} onChangeText={setIdEtiqueta} placeholder="Ex: KIT-001" autoCapitalize="characters" />
              </View>
              <TouchableOpacity style={styles.btnScanner} onPress={iniciarScanner}>
                <Feather name="maximize" size={24} color="#ea580c" />
              </TouchableOpacity>
            </View>

            {/* 👇 Alterado o texto para Personagem ou Acessório */}
            <Text style={styles.label}>Personagem ou Acessório *</Text>
            <TextInput style={styles.input} value={personagem} onChangeText={setPersonagem} placeholder="Ex: Noivo, Lampião, Tiara de Girassol..." />

            {/* 👇 Lógica de Autocompletar do Ano/Tema */}
            <View style={{ zIndex: 10, position: 'relative' }}>
              <Text style={styles.label}>Ano / Coleção *</Text>
              <TextInput 
                style={styles.input} 
                value={anoTema} 
                onChangeText={(texto) => {
                  setAnoTema(texto);
                  setMostrarSugestoesAno(true);
                }} 
                onFocus={() => setMostrarSugestoesAno(true)}
                placeholder="Ex: 2026 - Sertão" 
              />
              
              {mostrarSugestoesAno && sugestoesFiltradasAno.length > 0 && anoTema.length > 0 && (
                <ScrollView 
                  style={styles.listaSugestoes}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {sugestoesFiltradasAno.map((sugestao, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.itemSugestao}
                      onPress={() => {
                        setAnoTema(sugestao);
                        setMostrarSugestoesAno(false);
                        Keyboard.dismiss();
                      }}
                    >
                      <Feather name="clock" size={14} color="#9ca3af" style={{marginRight: 8}} />
                      <Text style={styles.itemSugestaoTexto}>{sugestao}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={styles.label}>Tipo de Peça *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
                <Picker.Item label="Roupa/Kit" value="Roupa" />
                <Picker.Item label="Acessório" value="Acessório" />
              </Picker>
            </View>

            <Text style={styles.label}>Gênero *</Text>
            <View style={styles.rowBtn}>
              {['Masculino', 'Feminino', 'Unissex'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.radioBtn, genero === cat && styles.radioBtnActive]}
                  onPress={() => setGenero(cat)}
                >
                  <Text style={[styles.radioText, genero === cat && styles.radioTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {kitParaEditar && (
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.label, { marginTop: 0 }]}>Status da Peça</Text>
                <TouchableOpacity 
                  style={{
                    backgroundColor: statusInterno === 'Ativo' ? '#fee2e2' : '#dcfce7',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: statusInterno === 'Ativo' ? '#ef4444' : '#22c55e'
                  }}
                  onPress={() => setStatusInterno(statusInterno === 'Ativo' ? 'Inativo' : 'Ativo')}
                >
                  <Text style={{
                    color: statusInterno === 'Ativo' ? '#dc2626' : '#166534',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    {statusInterno === 'Ativo' ? '🚫 Inativar Peça (Perdida/Danificada)' : '✅ Reativar Peça'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
              <Text style={styles.saveButtonText}>{kitParaEditar ? 'Guardar Alterações' : 'Guardar Peça'}</Text>
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
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 4 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
  
  btnScanner: { height: 50, width: 50, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  pickerContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },

  rowBtn: { flexDirection: 'row', gap: 8 },
  radioBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb' },
  radioBtnActive: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  radioText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  radioTextActive: { color: '#fff' },

  saveButton: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  imagePickerButton: { width: '100%', height: 200, backgroundColor: '#f3f4f6', borderRadius: 16, overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  imagePlaceholderText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  listaSugestoes: {backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, maxHeight: 160, marginTop: -10, marginBottom: 16,},
  itemSugestao: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemSugestaoTexto: { fontSize: 15, color: '#374151' }
});