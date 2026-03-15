import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const parseDataBR = (dataStr: string) => {
  if (!dataStr || !dataStr.includes('/')) return new Date(0); // Seguro para dados antigos
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

export default function AgendaCard({ item, onPressOpcoes }: any) {
  if (!item) return null; // Escudo Final

  let corStatus = '#ca8a04'; 
  let bgStatus = '#fef9c3'; 
  let borderColor = '#fef08a';
  
  if (item.status === 'Entregue') {
    corStatus = '#16a34a'; 
    bgStatus = '#dcfce7';
    borderColor = '#bbf7d0';
  } else if (item.status === 'Devolvido') {
    corStatus = '#4b5563'; 
    bgStatus = '#f3f4f6';
    borderColor = '#e5e7eb';
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  // O alerta de atraso só funciona se existir uma data de devolução!
  const estaAtrasado = item.status !== 'Devolvido' && item.data_devolucao && parseDataBR(item.data_devolucao) < hoje;

  const valorTotal = item.valor_aluguel || 0;
  const valorPago = item.valor_pago || 0;
  const valorPendente = valorTotal - valorPago;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: estaAtrasado ? '#dc2626' : corStatus }]} onPress={onPressOpcoes} activeOpacity={0.7}>
      <View style={styles.headerCard}>
        <Text style={styles.cardClient} numberOfLines={1}>{item.cliente_nome}</Text>
        
        {estaAtrasado ? (
          <View style={[styles.badge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
            <Text style={[styles.badgeText, { color: '#dc2626' }]}>🚨 ATRASADO</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: bgStatus, borderColor: borderColor }]}>
            <Text style={[styles.badgeText, { color: corStatus }]}>{item.status || 'Pendente'}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardKit}>{item.kit_nome}</Text>
      
      {/* ========================================== */}
      {/* SELO DA COSTUREIRA (Só aparece se houver medidas) */}
      {/* ========================================== */}
      {item.medidas_costureira && item.medidas_costureira.trim() !== '' && (
        <View style={styles.badgeCostureira}>
          <Feather name="scissors" size={12} color="#9333ea" />
          <Text style={styles.badgeCostureiraText}>Com Ajustes</Text>
        </View>
      )}

      <Text style={styles.cardDate}>
        <Feather name="calendar" size={14} color="#ea580c" /> {item.data_retirada || "S/Data"} até {item.data_devolucao || "S/Data"}
      </Text>

      <View style={styles.footerContainer}>
        <View style={styles.financeRow}>
          <Text style={styles.textSinal}>Pago: R$ {valorPago.toFixed(2).replace('.', ',')}</Text>
          {valorPendente <= 0 ? (
            <Text style={styles.textPago}>✅ Quitado</Text>
          ) : (
            <Text style={styles.textPendente}>⚠️ Falta: R$ {valorPendente.toFixed(2).replace('.', ',')}</Text>
          )}
        </View>

        {item.valor_multa > 0 && (
          <Text style={[
            styles.textMulta, 
            item.status_multa === 'Recebida' ? { color: '#16a34a' } : 
            item.status_multa === 'Cancelada' ? { color: '#9ca3af', textDecorationLine: 'line-through' } : 
            { color: '#dc2626' }
          ]}>
            Multa: R$ {item.valor_multa.toFixed(2).replace('.', ',')} ({item.status_multa})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, elevation: 1 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardClient: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  cardKit: { fontSize: 14, color: '#4b5563', marginBottom: 8 },
  
  // 👇 Novos estilos para o selo da Costureira
  badgeCostureira: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#faf5ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff', marginBottom: 8 },
  badgeCostureiraText: { fontSize: 10, color: '#9333ea', marginLeft: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  
  cardDate: { fontSize: 13, color: '#ea580c', fontWeight: '600', marginTop: 4 },
  footerContainer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textSinal: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  textPago: { fontSize: 13, color: '#16a34a', fontWeight: 'bold' },
  textPendente: { fontSize: 13, color: '#ea580c', fontWeight: 'bold' },
  textMulta: { fontSize: 12, fontWeight: 'bold', marginTop: 4 }
});