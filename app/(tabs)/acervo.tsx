import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// NOVO IMPORT: Precisamos do Picker para o menu de temas!
import { Picker } from '@react-native-picker/picker';

import KitCard from '../../components/KitCard';
import KitModal from '../../components/KitModal';
import { adicionarKit, atualizarKit, escutarKits, excluirKit } from '../../services/acervoService';

export default function AcervoScreen() {
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [kitEmEdicao, setKitEmEdicao] = useState<any>(null);
  
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // NOVO ESTADO: Guarda o Ano/Tema selecionado no filtro
  const [filtroAnoTema, setFiltroAnoTema] = useState('');

  // RADAR DO FIREBASE
  useEffect(() => {
    const unsubscribe = escutarKits(
      (dados: any[]) => { 
        setKits(dados || []); 
        setLoading(false); 
      },
      (erro: any) => { 
        console.error("Erro Acervo Firebase:", erro); 
        setLoading(false); 
      }
    );
    return () => unsubscribe();
  }, []);

  const handleOpcoesKit = (kit: any) => {
    Alert.alert(
      "Opções da Peça",
      `O que deseja fazer com ${kit.personagem}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Editar", onPress: () => { setKitEmEdicao(kit); setModalVisible(true); } },
        { text: "Excluir", style: "destructive", onPress: () => confirmarExclusao(kit) }
      ]
    );
  };

  const confirmarExclusao = (kit: any) => {
    Alert.alert(
      "Tem a certeza?",
      `Vai apagar definitivamente o kit ${kit.id_etiqueta}. Esta ação não pode ser desfeita.`,
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", style: "destructive", onPress: async () => {
            try { await excluirKit(kit.id); } catch (error) { alert("Erro ao excluir."); }
          }
        }
      ]
    );
  };

  const handleSalvarKit = async (dadosKit: any) => {
    try {
      if (kitEmEdicao) {
        await atualizarKit(kitEmEdicao.id, dadosKit);
      } else {
        await adicionarKit(dadosKit);
      }
      setModalVisible(false); 
      setKitEmEdicao(null); 
    } catch (error) {
      alert("Erro ao salvar a peça.");
    }
  };

  // MÁGICA: Extrair Temas Únicos automaticamente
  const anosTemasUnicos = [...new Set(kits
    .map(k => k && (k.ano_tema || k.tema))
    .filter(t => t) // Remove os vazios
  )];

  // FILTRO TRIPLO: Gênero + Ano/Tema + Busca de Texto
  const kitsFiltrados = (kits || []).filter((kit: any) => {
    if (!kit) return false;

    // 1. Regra da Categoria (Gênero)
    let matchCategory = false;
    if (activeCategory === 'Todos') {
      matchCategory = true;
    } else {
      matchCategory = kit.genero === activeCategory; 
    }

    // 2. Regra do Ano/Tema (O Novo Filtro)
    let matchTema = true; // Se o filtro estiver vazio, aprova tudo
    if (filtroAnoTema) {
      matchTema = (kit.ano_tema === filtroAnoTema || kit.tema === filtroAnoTema);
    }

    // 3. Regra da Busca de Texto
    let matchSearch = true;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      matchSearch = (
        (kit.id_etiqueta && kit.id_etiqueta.toLowerCase().includes(searchLower)) ||
        (kit.personagem && kit.personagem.toLowerCase().includes(searchLower)) ||
        (kit.ano_tema && kit.ano_tema.toLowerCase().includes(searchLower))
      );
    }

    return matchCategory && matchTema && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acervo</Text>
        
        {/* BARRA DE PESQUISA + BOTÃO ADICIONAR */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput 
              style={{ flex: 1 }} 
              placeholder="Pesquisar ID ou Personagem..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* NOVO: SELETOR DE ANO/TEMA */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={filtroAnoTema} 
              onValueChange={setFiltroAnoTema} 
              style={styles.picker}
            >
              <Picker.Item label="Todos os Anos / Temas" value="" />
              {anosTemasUnicos.map(at => (
                <Picker.Item key={at as string} label={`Coleção: ${at}`} value={at as string} />
              ))}
            </Picker>
          </View>
        </View>

        {/* ABAS DE CATEGORIA */}
        <View style={styles.tabsRowContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {['Todos', 'Masculino', 'Feminino', 'Acessório'].map((cat) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setActiveCategory(cat)}
                style={[styles.tab, activeCategory === cat && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                  {cat === 'Todos' ? 'Todos' : cat === 'Acessório' ? 'Acessórios' : `Kits ${cat.substring(0, 4)}.`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* RADAR DE DIAGNÓSTICO */}
        <View style={{ backgroundColor: '#e0f2fe', padding: 8, alignItems: 'center' }}>
          <Text style={{ color: '#0369a1', fontWeight: 'bold', fontSize: 12 }}>
            🛠️ RADAR: {kits.length} no Firebase | {kitsFiltrados.length} no Filtro
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
          {kitsFiltrados.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>Nenhuma peça encontrada.</Text>
          ) : (
            kitsFiltrados.map(kit => (
              <KitCard key={kit.id} kit={kit} onPressOptions={() => handleOpcoesKit(kit)} />
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <KitModal 
        visible={modalVisible} 
        onClose={() => { setModalVisible(false); setKitEmEdicao(null); }} 
        onSave={handleSalvarKit} 
        kitParaEditar={kitEmEdicao} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', zIndex: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', paddingHorizontal: 24, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  btnAdd: { width: 44, height: 44, backgroundColor: '#ea580c', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  // Estilos do Novo Picker de Tema
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb', justifyContent: 'center' },
  picker: { height: 49, width: '100%' },

  tabsRowContainer: { paddingBottom: 12 },
  tabsScroll: { paddingHorizontal: 24, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#ea580c' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' }
});