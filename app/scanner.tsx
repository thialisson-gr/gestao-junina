import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AluguerModal from '../components/AluguerModal';
import { escutarKits } from '../services/acervoService';
import { adicionarAluguer, atualizarAluguer, escutarAlugueres } from '../services/agendaService';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  const [kits, setKits] = useState<any[]>([]);
  const [alugueres, setAlugueres] = useState<any[]>([]); 
  
  const [pecaEncontrada, setPecaEncontrada] = useState<any>(null);
  const [aluguerAtivo, setAluguerAtivo] = useState<any>(null); 
  
  const [modalAluguerVisible, setModalAluguerVisible] = useState(false);

  useEffect(() => {
    const unsubK = escutarKits((d: any[]) => setKits(d || []), (e: any) => console.log(e));
    const unsubA = escutarAlugueres((d: any[]) => setAlugueres(d || []), (e: any) => console.log(e));
    return () => { if (unsubK) unsubK(); if (unsubA) unsubA(); };
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
        <Text style={styles.textoPermissao}>Precisamos de permissão para usar a câmara.</Text>
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

    const peca = kits.find(k => k?.id_etiqueta === data);

    if (peca) {
      setPecaEncontrada(peca);
      const ativo = alugueres.find(a => a?.kit_id === peca?.id && a?.status !== 'Devolvido' && a?.status !== 'Cancelado');
      setAluguerAtivo(ativo || null);

    } else {
      Alert.alert(
        "Peça Não Encontrada 🕵️‍♂️",
        `A etiqueta "${data}" não está registada no seu acervo.`,
        [
          { text: "Ler Outra Etiqueta", onPress: () => setScanned(false) },
          { text: "Voltar ao Início", onPress: () => router.back(), style: "cancel" }
        ]
      );
    }
  };

  const handleDevolucaoAJato = () => {
    if (!aluguerAtivo) return;
    
    Alert.alert(
      "Confirmar Devolução",
      `Deseja marcar a peça entregue por ${aluguerAtivo?.cliente_nome} como Devolvida?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Receber", 
          onPress: async () => {
            await atualizarAluguer(aluguerAtivo.id, { status: 'Devolvido' });
            Alert.alert("Sucesso! ✅", "Peça devolvida e libertada para novos alugueres.");
            setPecaEncontrada(null);
            setAluguerAtivo(null);
            setScanned(false);
          }
        }
      ]
    );
  };

  const handleRaioX = () => {
    const historico = alugueres.filter(a => a?.kit_id === pecaEncontrada?.id);
    const totalVezes = historico.length;
    const ultimoCliente = historico.length > 0 ? historico[0]?.cliente_nome : 'Nunca alugada';

    Alert.alert(
      "Raio-X: " + (pecaEncontrada?.id_etiqueta || ''),
      `👗 Coleção: ${pecaEncontrada?.ano_tema || 'N/A'}\n` +
      `📦 Status Interno: ${pecaEncontrada?.status_interno || 'Disponível'}\n\n` +
      `📊 Histórico:\n` +
      `- Alugada ${totalVezes} vezes no total.\n` +
      `- Último cliente: ${ultimoCliente}\n\n` +
      `(Nota: No futuro, este botão vai abrir o ecrã completo de detalhes da peça no Acervo!)`,
      [{ text: "Fechar", style: "cancel" }]
    );
  };

  // 👇 Os pontos de interrogação garantem que não há falhas mesmo se o estado estiver a ser limpo
  const isDisponivel = !aluguerAtivo && (!pecaEncontrada?.status_interno || pecaEncontrada?.status_interno === 'Disponível');

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"] }}
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
              <View style={[styles.statusBadge, { backgroundColor: aluguerAtivo ? '#fee2e2' : '#dcfce7' }]}>
                <Text style={[styles.statusText, { color: aluguerAtivo ? '#dc2626' : '#16a34a' }]}>
                  {aluguerAtivo ? 'ALUGADO' : 'LIVRE'}
                </Text>
              </View>
              <Text style={styles.textoEtiqueta}>#{pecaEncontrada?.id_etiqueta}</Text>
            </View>

            {/* 👇 Adicionámos o ?. antes de todas as propriedades para blindar o código */}
            <Text style={styles.nomePeca}>{pecaEncontrada?.personagem || pecaEncontrada?.descricao || 'Peça sem nome'}</Text>
            
            {aluguerAtivo && (
              <View style={styles.infoAluguerBox}>
                <Feather name="user" size={14} color="#b91c1c" />
                <Text style={styles.infoAluguerTexto}>
                  Com: <Text style={{fontWeight: 'bold'}}>{aluguerAtivo?.cliente_nome}</Text> {'\n'}
                  Volta em: {aluguerAtivo?.data_devolucao}
                </Text>
              </View>
            )}

            {!aluguerAtivo && (
              <>
                <Text style={styles.detalhesPeca}>👗 Coleção: {pecaEncontrada?.ano_tema || pecaEncontrada?.tema || 'N/A'}</Text>
                <Text style={styles.detalhesPeca}>📏 Tamanho: {pecaEncontrada?.tamanho || 'Único'}</Text>
              </>
            )}

            <View style={styles.cartaoAcoes}>
              
              <TouchableOpacity style={styles.btnRaioX} onPress={handleRaioX}>
                <Feather name="search" size={20} color="#4b5563" />
              </TouchableOpacity>

              {isDisponivel && (
                <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#ea580c' }]} onPress={() => setModalAluguerVisible(true)}>
                  <Feather name="shopping-bag" size={20} color="#fff" />
                  <Text style={styles.btnAcaoTexto}>Alugar</Text>
                </TouchableOpacity>
              )}

              {aluguerAtivo && (
                <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#16a34a' }]} onPress={handleDevolucaoAJato}>
                  <Feather name="rotate-ccw" size={20} color="#fff" />
                  <Text style={styles.btnAcaoTexto}>Receber Peça</Text>
                </TouchableOpacity>
              )}

            </View>
            
            <TouchableOpacity onPress={() => { setPecaEncontrada(null); setScanned(false); }} style={{marginTop: 15, paddingVertical: 10}}>
              <Text style={{textAlign: 'center', color: '#6b7280', fontWeight: 'bold'}}>Ler outra etiqueta</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.miraExterna}>
            <View style={styles.miraInterna}></View>
          </View>
        )}

        <View style={styles.rodape}>
          <Text style={styles.instrucaoTexto}>
            {pecaEncontrada ? "Ação rápida pronta!" : "Aponte a câmara para a etiqueta"}
          </Text>
        </View>

      </View>

      <AluguerModal 
        visible={modalAluguerVisible} 
        kitInicialId={pecaEncontrada?.id} 
        onClose={() => setModalAluguerVisible(false)} 
        onSave={async (d: any) => { 
          await adicionarAluguer(d);
          setModalAluguerVisible(false);
          setPecaEncontrada(null);
          setScanned(false);
          Alert.alert("Sucesso! 🎉", "Aluguer registado.");
        }} 
        alugueresExistentes={alugueres || []} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  textoPermissao: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
  btnPermissao: { backgroundColor: '#ea580c', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnPermissaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between' },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20 },
  btnVoltar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  tituloTopo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  miraExterna: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  miraInterna: { width: 250, height: 250, borderWidth: 2, borderColor: '#ea580c', backgroundColor: 'transparent', borderRadius: 24 },
  
  cartaoResultado: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 20, elevation: 5, alignSelf: 'center', width: '90%' },
  cartaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  textoEtiqueta: { fontSize: 14, color: '#6b7280', fontWeight: 'bold' },
  nomePeca: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
  detalhesPeca: { fontSize: 14, color: '#4b5563', marginBottom: 4, fontWeight: '500' },
  
  infoAluguerBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', gap: 10 },
  infoAluguerTexto: { color: '#991b1b', fontSize: 14, flex: 1 },

  cartaoAcoes: { flexDirection: 'row', marginTop: 15, gap: 10 },
  btnRaioX: { backgroundColor: '#f3f4f6', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  btnAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnAcaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  rodape: { padding: 30, paddingBottom: 50, alignItems: 'center' },
  instrucaoTexto: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '500' }
});