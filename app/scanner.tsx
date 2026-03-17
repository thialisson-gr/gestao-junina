import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AluguerModal from '../components/AluguerModal';
import { escutarKits } from '../services/acervoService';
import { adicionarAluguer, atualizarAluguer, escutarAlugueres } from '../services/agendaService';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  // 👇 Mudámos de `scanned` para `cameraPaused` para gerir melhor a câmara enquanto se mexe no ecrã
  const [cameraPaused, setCameraPaused] = useState(false);
  const router = useRouter();

  const [kits, setKits] = useState<any[]>([]);
  const [alugueres, setAlugueres] = useState<any[]>([]); 
  
  // 👇 NOVO ESTADO: O "Carrinho de Compras" do Supermercado
  const [carrinhoPecas, setCarrinhoPecas] = useState<any[]>([]);
  
  const [pecaEncontradaParaDevolucao, setPecaEncontradaParaDevolucao] = useState<any>(null);
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
    setCameraPaused(true);

    const peca = kits.find(k => k?.id_etiqueta === data);

    if (peca) {
      const ativo = alugueres.find(a => a?.kit_id === peca?.id && a?.status !== 'Devolvido' && a?.status !== 'Cancelado');
      
      if (ativo) {
        // Se a peça lida estiver alugada a alguém, abre o modo de "Devolução/Recebimento a Jato"
        setPecaEncontradaParaDevolucao(peca);
        setAluguerAtivo(ativo);
      } else {
        // Se a peça lida estiver Livre, adiciona ao "Carrinho" de novo aluguel
        const jaEstaNoCarrinho = carrinhoPecas.some(p => p.id === peca.id);
        
        if (!jaEstaNoCarrinho) {
          // O nome formatado é importante para bater certo com o formato que o Modal espera
          const nomeFormatado = `${peca.id_etiqueta ? '['+peca.id_etiqueta+'] ' : ''}${peca.personagem || peca.descricao || 'Sem nome'}`;
          setCarrinhoPecas(prev => [...prev, { id: peca.id, nome: nomeFormatado }]);
          // Avisa de forma suave e liberta a câmara logo a seguir
          Alert.alert("Peça Adicionada!", `A peça #${peca.id_etiqueta} foi colocada na lista de aluguel.`, [{ text: "Ler Próxima", onPress: () => setCameraPaused(false) }]);
        } else {
          Alert.alert("Aviso", "Esta peça já está na sua lista de leitura.", [{ text: "Ok", onPress: () => setCameraPaused(false) }]);
        }
      }
    } else {
      Alert.alert(
        "Peça Não Encontrada 🕵️‍♂️",
        `A etiqueta "${data}" não está registada no seu acervo.`,
        [
          { text: "Ler Outra Etiqueta", onPress: () => setCameraPaused(false) },
          { text: "Voltar ao Início", onPress: () => router.back(), style: "cancel" }
        ]
      );
    }
  };

  const removerDoCarrinho = (id: string) => {
    setCarrinhoPecas(prev => prev.filter(p => p.id !== id));
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
            setPecaEncontradaParaDevolucao(null);
            setAluguerAtivo(null);
            setCameraPaused(false); // Liberta a câmara para ler mais
          }
        }
      ]
    );
  };

  // 👇 Preparamos os dados falsos para injetar no Modal como se fosse um "Aluguel Para Editar"
  // Isto é um truque genial para não termos de reescrever o código do Modal todo!
  const mockAluguelParaOModal = carrinhoPecas.length > 0 ? {
    kits_alugados: carrinhoPecas // Injeta a nossa lista lida diretamente na lista do Modal
  } : null;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={cameraPaused ? undefined : handleBarCodeScanned}
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
        
        {/* ========================================== */}
        {/* CARTÃO DE DEVOLUÇÃO (Só aparece se ler uma peça alugada) */}
        {/* ========================================== */}
        {pecaEncontradaParaDevolucao && aluguerAtivo ? (
          <View style={styles.cartaoResultado}>
            <View style={styles.cartaoHeader}>
              <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: '#dc2626' }]}>ALUGADO</Text>
              </View>
              <Text style={styles.textoEtiqueta}>#{pecaEncontradaParaDevolucao?.id_etiqueta}</Text>
            </View>

            <Text style={styles.nomePeca}>{pecaEncontradaParaDevolucao?.personagem || pecaEncontradaParaDevolucao?.descricao || 'Peça sem nome'}</Text>
            
            <View style={styles.infoAluguerBox}>
              <Feather name="user" size={14} color="#b91c1c" />
              <Text style={styles.infoAluguerTexto}>
                Com: <Text style={{fontWeight: 'bold'}}>{aluguerAtivo?.cliente_nome}</Text> {'\n'}
                Volta em: {aluguerAtivo?.data_devolucao}
              </Text>
            </View>

            <View style={styles.cartaoAcoes}>
              <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#16a34a' }]} onPress={handleDevolucaoAJato}>
                <Feather name="rotate-ccw" size={20} color="#fff" />
                <Text style={styles.btnAcaoTexto}>Receber Peça</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={() => { setPecaEncontradaParaDevolucao(null); setAluguerAtivo(null); setCameraPaused(false); }} style={{marginTop: 15, paddingVertical: 10}}>
              <Text style={{textAlign: 'center', color: '#6b7280', fontWeight: 'bold'}}>Ler outra etiqueta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.miraExterna}>
            <View style={styles.miraInterna}></View>
          </View>
        )}

        {/* ========================================== */}
        {/* CARRINHO DE PEÇAS LIDAS NO RODAPÉ */}
        {/* ========================================== */}
        <View style={styles.rodape}>
          {!pecaEncontradaParaDevolucao && carrinhoPecas.length > 0 ? (
            <View style={styles.carrinhoContainer}>
              <Text style={styles.carrinhoTitulo}>Peças Lidas ({carrinhoPecas.length})</Text>
              
              <ScrollView style={{ maxHeight: 120, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
                {carrinhoPecas.map(p => (
                  <View key={p.id} style={styles.carrinhoItem}>
                    <Text style={styles.carrinhoItemNome} numberOfLines={1}>{p.nome}</Text>
                    <TouchableOpacity onPress={() => removerDoCarrinho(p.id)} style={{ padding: 4 }}>
                      <Feather name="x" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.btnFinalizarCarrinho} onPress={() => { setCameraPaused(true); setModalAluguerVisible(true); }}>
                <Feather name="shopping-bag" size={20} color="#fff" />
                <Text style={styles.btnFinalizarTexto}>Avançar para Aluguel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.instrucaoTexto}>
              {pecaEncontradaParaDevolucao ? "Ação rápida pronta!" : "Aponte a câmara para a etiqueta"}
            </Text>
          )}
        </View>

      </View>

      <AluguerModal 
        visible={modalAluguerVisible} 
        aluguerParaEditar={mockAluguelParaOModal} // 👈 Aqui entra o nosso truque!
        onClose={() => {
          setModalAluguerVisible(false);
          setCameraPaused(false);
        }} 
        onSave={async (d: any) => { 
          await adicionarAluguer(d);
          setModalAluguerVisible(false);
          setCarrinhoPecas([]); // Esvazia o carrinho depois de alugar
          setCameraPaused(false);
          Alert.alert("Sucesso! 🎉", "Aluguel registado com todas as peças.");
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
  
  infoAluguerBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', gap: 10 },
  infoAluguerTexto: { color: '#991b1b', fontSize: 14, flex: 1 },

  cartaoAcoes: { flexDirection: 'row', marginTop: 15, gap: 10 },
  btnAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnAcaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  rodape: { padding: 20, paddingBottom: 40 },
  instrucaoTexto: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '500' },
  
  // 👇 ESTILOS DO NOVO CARRINHO
  carrinhoContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 20, width: '100%', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  carrinhoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  carrinhoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  carrinhoItemNome: { fontSize: 14, color: '#374151', flex: 1, fontWeight: '500' },
  btnFinalizarCarrinho: { backgroundColor: '#ea580c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnFinalizarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});