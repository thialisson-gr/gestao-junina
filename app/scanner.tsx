import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AluguerModal from '../components/AluguerModal';
import { escutarKits } from '../services/acervoService';
import { adicionarAluguer } from '../services/agendaService'; // 👇 Para salvar o novo aluguer

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  const [kits, setKits] = useState<any[]>([]);
  const [pecaEncontrada, setPecaEncontrada] = useState<any>(null);
  
  // 👇 Estado para controlar o modal de aluguer diretamente daqui
  const [modalAluguerVisible, setModalAluguerVisible] = useState(false);

  useEffect(() => {
    const unsub = escutarKits(
      (dados: any[]) => setKits(dados || []),
      (erro: any) => console.log(erro)
    );
    return () => { if (unsub) unsub(); };
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={{color: '#fff', marginTop: 10}}>A preparar câmara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Feather name="camera-off" size={64} color="#9ca3af" style={{ marginBottom: 20 }} />
        <Text style={styles.textoPermissao}>
          Precisamos de permissão para usar a câmara e ler as etiquetas das peças.
        </Text>
        <TouchableOpacity style={styles.btnPermissao} onPress={requestPermission}>
          <Text style={styles.btnPermissaoTexto}>Conceder Permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: any) => {
    setScanned(true);

    const peca = kits.find(k => k.id_etiqueta === data);

    if (peca) {
      setPecaEncontrada(peca);
    } else {
      Alert.alert(
        "Peça Não Encontrada 🕵️‍♂️",
        `A etiqueta "${data}" não está registada no seu acervo do sistema.`,
        [
          { text: "Ler Outra Etiqueta", onPress: () => setScanned(false) },
          { text: "Voltar ao Início", onPress: () => router.back(), style: "cancel" }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
        }}
      />

      <View style={styles.overlay}>
        
        <View style={styles.topo}>
          <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.tituloTopo}>Leitor de Etiquetas</Text>
          <View style={{width: 44}}></View>
        </View>
        
        {pecaEncontrada ? (
          <View style={styles.cartaoResultado}>
            <View style={styles.cartaoHeader}>
              <View style={[styles.statusBadge, { backgroundColor: pecaEncontrada.status_interno === 'Alugado' ? '#fee2e2' : '#dcfce7' }]}>
                <Text style={[styles.statusText, { color: pecaEncontrada.status_interno === 'Alugado' ? '#dc2626' : '#16a34a' }]}>
                  {pecaEncontrada.status_interno || 'Disponível'}
                </Text>
              </View>
              <Text style={styles.textoEtiqueta}>#{pecaEncontrada.id_etiqueta}</Text>
            </View>

            <Text style={styles.nomePeca}>{pecaEncontrada.personagem || pecaEncontrada.descricao || 'Peça sem nome'}</Text>
            <Text style={styles.detalhesPeca}>👗 Coleção: {pecaEncontrada.ano_tema || pecaEncontrada.tema || 'N/A'}</Text>
            <Text style={styles.detalhesPeca}>📏 Tamanho: {pecaEncontrada.tamanho || 'Único'} | 👫 {pecaEncontrada.genero || 'Unissex'}</Text>

            <View style={styles.cartaoAcoes}>
              {/* Botão de Ler Outra Peça (Ficou cinza) */}
              <TouchableOpacity 
                style={[styles.btnAcaoLaranja, { backgroundColor: '#4b5563' }]} 
                onPress={() => {
                  setPecaEncontrada(null);
                  setScanned(false);
                }}
              >
                <Feather name="maximize" size={20} color="#fff" />
                <Text style={styles.btnAcaoLaranjaTexto}>Ler Outra</Text>
              </TouchableOpacity>

              {/* 👇 NOVO BOTÃO: Só aparece se a peça estiver Livre! */}
              {(!pecaEncontrada.status_interno || pecaEncontrada.status_interno === 'Disponível') && (
                <TouchableOpacity 
                  style={[styles.btnAcaoLaranja, { backgroundColor: '#ea580c' }]} 
                  onPress={() => setModalAluguerVisible(true)}
                >
                  <Feather name="shopping-bag" size={20} color="#fff" />
                  <Text style={styles.btnAcaoLaranjaTexto}>Alugar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.miraExterna}>
            <View style={styles.miraInterna}></View>
          </View>
        )}

        <View style={styles.rodape}>
          <Text style={styles.instrucaoTexto}>
            {pecaEncontrada ? "Peça identificada com sucesso!" : "Aponte a câmara para a etiqueta da peça"}
          </Text>
        </View>

      </View>

      {/* 👇 MODAL SENDO CHAMADO DIRETAMENTE DAQUI */}
      <AluguerModal 
        visible={modalAluguerVisible} 
        kitInicialId={pecaEncontrada?.id} // Mandamos a peça pra lá!
        onClose={() => setModalAluguerVisible(false)} 
        onSave={async (d: any) => { 
          await adicionarAluguer(d);
          setModalAluguerVisible(false);
          // Volta pra mira para ler a próxima peça
          setPecaEncontrada(null);
          setScanned(false);
          Alert.alert("Sucesso! 🎉", "Aluguer registado e integrado na Agenda.");
        }} 
        alugueresExistentes={[]} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  textoPermissao: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20, lineHeight: 24, paddingHorizontal: 40 },
  btnPermissao: { backgroundColor: '#ea580c', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnPermissaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between' },
  
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20 },
  btnVoltar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  tituloTopo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  miraExterna: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  miraInterna: { width: 250, height: 250, borderWidth: 2, borderColor: '#ea580c', backgroundColor: 'transparent', borderRadius: 24 },
  
  cartaoResultado: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, alignSelf: 'center', width: '90%' },
  cartaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  textoEtiqueta: { fontSize: 14, color: '#6b7280', fontWeight: 'bold' },
  nomePeca: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
  detalhesPeca: { fontSize: 14, color: '#4b5563', marginBottom: 4, fontWeight: '500' },
  cartaoAcoes: { flexDirection: 'row', marginTop: 20, gap: 10 },
  btnAcaoLaranja: { flex: 1, backgroundColor: '#ea580c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnAcaoLaranjaTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  rodape: { padding: 30, paddingBottom: 50, alignItems: 'center' },
  instrucaoTexto: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '500' }
});