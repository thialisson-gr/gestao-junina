import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  // Dados simulados (Mock Data) para testarmos o visual
  const stats = [
    { id: 'entregas', label: 'Entregas Hoje', value: '8', icon: 'arrow-up-circle', color: '#eff6ff', iconColor: '#1d4ed8' },
    { id: 'devolucoes', label: 'Devolv. Hoje', value: '5', icon: 'arrow-down-circle', color: '#f0fdf4', iconColor: '#15803d' },
    { id: 'atrasos', label: 'Atrasados', value: '3', icon: 'alert-triangle', color: '#fef2f2', iconColor: '#b91c1c' },
    { id: 'costureira', label: 'Na Costureira', value: '12', icon: 'scissors', color: '#faf5ff', iconColor: '#7e22ce' },
  ];

  const agendaHoje = [
    { id: 1, tipo: 'entrega', aluno: 'João Pedro', kit: 'KIT-MASC-2026-005 (Noivo)', hora: '10:30' },
    { id: 2, tipo: 'atraso', aluno: 'Maria Clara', kit: 'KIT-FEM-2025-012 (Rainha)', hora: '2 dias' },
    { id: 3, tipo: 'devolucao', aluno: 'Lucas Silva', kit: 'KIT-MASC-2026-010 (Brincante)', hora: '14:00' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.dateText}>13 de Março, 2026</Text>
        <Text style={styles.greeting}>Olá, Gestor! 👋</Text>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ea580c' }]}>
          <Feather name="plus-circle" size={28} color="#fff" />
          <Text style={styles.actionText}>Novo Aluguer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#111827' }]}>
          <Feather name="maximize" size={28} color="#fff" />
          <Text style={styles.actionText}>Ler Etiqueta</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo do Dia */}
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

      {/* Agenda Imediata */}
      <View style={styles.section}>
        <View style={styles.agendaHeader}>
          <Text style={styles.sectionTitle}>Próximos Movimentos</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver Todos</Text>
          </TouchableOpacity>
        </View>
        
        {agendaHoje.map((item) => (
          <View key={item.id} style={styles.agendaItem}>
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
            </View>
            <Text style={[styles.agendaTime, { color: item.tipo === 'atraso' ? '#b91c1c' : '#111827' }]}>
              {item.hora}
            </Text>
          </View>
        ))}
      </View>

      {/* Espaçamento no fundo para a barra de navegação não tapar nada */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Estilos CSS convertidos para React Native
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2, // Sombra no Android
    shadowColor: '#000', // Sombras no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%', // Ocupa quase metade do ecrã
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  agendaItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
    marginBottom: 12,
  },
  agendaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  agendaInfo: {
    flex: 1,
  },
  agendaName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  agendaKit: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  agendaTime: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
