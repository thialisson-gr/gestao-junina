import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AluguerModal from '../../components/AluguerModal';
// 👇 Importando as funções do Firebase
import { adicionarAluguer, atualizarAluguer, escutarAlugueres } from '../../services/agendaService';

const parseDataBR = (dataStr: string) => {
  if (!dataStr || !dataStr.includes('/')) return new Date(0);
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

const getHojeStr = () => {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
};

export default function HomeScreen() {
  const router = useRouter();  const [modalVisible, setModalVisible] = useState(false);
  const [aluguerParaEditar, setAluguerParaEditar] = useState<any>(null);
  
  // 👇 Novos estados para guardar os dados reais
  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuta as alterações no Firebase em tempo real
  useEffect(() => {
    const unsub = escutarAlugueres(
      (dados: any[]) => { setAlugueres(dados || []); setLoading(false); },
      (erro: any) => { console.log(erro); setLoading(false); }
    );
    return () => { if(unsub) unsub(); };
  }, []);

  // Cria a data por extenso dinamicamente (Ex: "15 de Março, 2026")
  const dataAtual = new Date();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dataFormatadaTexto = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]}, ${dataAtual.getFullYear()}`;

  // ==========================================
  // LÓGICA DO DASHBOARD (Calculada em tempo real)
  // ==========================================
  const hojeStr = getHojeStr();
  const hojeObj = new Date();
  hojeObj.setHours(0, 0, 0, 0);

  let countEntregas = 0;
  let countDevolucoes = 0;
  let countAtrasados = 0;
  let countCostureira = 0;
  let agendaHoje: any[] = [];

  alugueres.forEach(alug => {
    const isDevolvido = alug.status === 'Devolvido';
    const isCancelado = alug.status === 'Cancelado';
    
    // Ignora os que já estão finalizados ou cancelados
    if (isDevolvido || isCancelado) return; 

    const dataDevObj = parseDataBR(alug.data_devolucao);
    let adicionadoNaAgenda = false;

    // 1. Na Costureira (Tem ajustes e ainda não foi devolvido)
    if (alug.medidas_costureira && alug.medidas_costureira.trim() !== '') {
      countCostureira++;
    }

    // 2. Atrasados (Data de devolução passou de hoje)
    if (dataDevObj < hojeObj) {
      countAtrasados++;
      agendaHoje.push({ ...alug, tipo: 'atraso', hora: 'Atrasado', aluno: alug.cliente_nome, kit: alug.kit_nome });
      adicionadoNaAgenda = true;
    }

    // 3. Entregas (Retiradas) Hoje
    if (alug.data_retirada === hojeStr) {
      countEntregas++;
      if (!adicionadoNaAgenda) {
        agendaHoje.push({ ...alug, tipo: 'entrega', hora: 'Sai Hoje', aluno: alug.cliente_nome, kit: alug.kit_nome });
        adicionadoNaAgenda = true;
      }
    }

    // 4. Devoluções Hoje
    if (alug.data_devolucao === hojeStr) {
      countDevolucoes++;
      if (!adicionadoNaAgenda) {
        agendaHoje.push({ ...alug, tipo: 'devolucao', hora: 'Volta Hoje', aluno: alug.cliente_nome, kit: alug.kit_nome });
      }
    }
  });

  const stats = [
    { id: 'entregas', label: 'Entregas Hoje', value: countEntregas.toString(), icon: 'arrow-up-circle', color: '#eff6ff', iconColor: '#1d4ed8' },
    { id: 'devolucoes', label: 'Devolv. Hoje', value: countDevolucoes.toString(), icon: 'arrow-down-circle', color: '#f0fdf4', iconColor: '#15803d' },
    { id: 'atrasos', label: 'Atrasados', value: countAtrasados.toString(), icon: 'alert-triangle', color: '#fef2f2', iconColor: '#b91c1c' },
    { id: 'costureira', label: 'Na Costureira', value: countCostureira.toString(), icon: 'scissors', color: '#faf5ff', iconColor: '#7e22ce' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <Text style={styles.dateText}>{dataFormatadaTexto}</Text>
        <Text style={styles.greeting}>Olá, Gestor! 👋</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#ea580c' }]}
          onPress={() => {
            setAluguerParaEditar(null);
            setModalVisible(true);
          }}
        >
          <Feather name="plus-circle" size={28} color="#fff" />
          <Text style={styles.actionText}>Novo Aluguer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#111827' }]}
          onPress={() => router.push('/scanner' as any)}
        >
          <Feather name="maximize" size={28} color="#fff" />
          <Text style={styles.actionText}>Ler Etiqueta</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo do Dia</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <View key={stat.id} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.iconWrapper, { backgroundColor: stat.color }]}>
                      <Feather name={stat.icon as any} size={20} color={stat.iconColor} />
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.agendaHeader}>
              <Text style={styles.sectionTitle}>Próximos Movimentos</Text>
              <TouchableOpacity onPress={() => router.push('/agenda')}>
                <Text style={styles.seeAllText}>Ver Todos</Text>
              </TouchableOpacity>
            </View>
            
            {agendaHoje.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 10 }}>Nenhuma movimentação pendente para hoje.</Text>
            ) : (
              agendaHoje.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.agendaItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setAluguerParaEditar(item);
                    setModalVisible(true);
                  }}
                >
                  <View style={[styles.agendaIcon, { 
                    backgroundColor: item.tipo === 'entrega' ? '#eff6ff' : item.tipo === 'devolucao' ? '#f0fdf4' : '#fef2f2' 
                  }]}>
                    <Feather 
                      name={item.tipo === 'entrega' ? 'arrow-up-circle' : item.tipo === 'devolucao' ? 'arrow-down-circle' : 'alert-triangle'} 
                      size={20} 
                      color={item.tipo === 'entrega' ? '#1d4ed8' : item.tipo === 'devolucao' ? '#15803d' : '#b91c1c'} 
                    />
                  </View>
                  
                  <View style={styles.agendaInfo}>
                    <Text style={styles.agendaName}>{item.aluno}</Text>
                    <Text style={styles.agendaKit} numberOfLines={1}>{item.kit}</Text>
                    
                    {item.medidas_costureira && item.medidas_costureira.trim() !== '' && (
                      <View style={styles.badgeCostureira}>
                        <Feather name="scissors" size={12} color="#9333ea" />
                        <Text style={styles.badgeCostureiraText}>Com Ajustes</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[styles.agendaTime, { color: item.tipo === 'atraso' ? '#b91c1c' : '#111827' }]}>
                    {item.hora}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />

      <AluguerModal 
        visible={modalVisible} 
        aluguerParaEditar={aluguerParaEditar}
        onClose={() => {
          setModalVisible(false);
          setAluguerParaEditar(null);
        }} 
        onSave={async (d: any) => { 
          // 👇 Agora o modal do Início salva diretamente no Firebase!
          if(d.id) {
            await atualizarAluguer(d.id, d);
          } else {
            await adicionarAluguer(d);
          }
          setModalVisible(false); 
          setAluguerParaEditar(null);
        }} 
        alugueresExistentes={alugueres || []} 
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dateText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  quickActionsContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 24, gap: 16 },
  actionButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionText: { color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  section: { paddingHorizontal: 24, marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  iconWrapper: { padding: 8, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  statLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { fontSize: 14, fontWeight: 'bold', color: '#ea580c' },
  agendaItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', marginBottom: 12 },
  agendaIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  agendaInfo: { flex: 1 },
  agendaName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  agendaKit: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  agendaTime: { fontSize: 12, fontWeight: 'bold' },
  badgeCostureira: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#faf5ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff', marginTop: 6 },
  badgeCostureiraText: { fontSize: 10, color: '#9333ea', marginLeft: 4, fontWeight: 'bold', textTransform: 'uppercase' },
});