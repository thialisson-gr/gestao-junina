import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const parseDataBR = (dataStr: string) => {
  if (!dataStr || !dataStr.includes('/')) return new Date(0);
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

const formatarMoeda = (valor: number) => {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
};

export default function AgendaCard({ item, onPressOpcoes }: any) {
  // 👇 Estado que controla se o cartão está aberto ou fechado
  const [expandido, setExpandido] = useState(false);

  if (!item) return null;

  let corStatus = '#ca8a04'; 
  let bgStatus = '#fef9c3'; 
  let borderColor = '#fef08a';
  
  if (item.status === 'Entregue') {
    corStatus = '#16a34a'; 
    bgStatus = '#dcfce7';
    borderColor = '#bbf7d0';
  } else if (item.status === 'Devolvido') {
    corStatus = '#6b7280'; 
    bgStatus = '#f3f4f6';
    borderColor = '#e5e7eb';
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  const estaAtrasado = item.status !== 'Devolvido' && item.data_devolucao && parseDataBR(item.data_devolucao) < hoje;

  const valorTotal = Number(item.valor_aluguel) || 0;
  const valorPago = Number(item.valor_pago) || 0;
  const valorPendente = valorTotal - valorPago;

  return (
    <View style={[styles.card, { borderLeftColor: estaAtrasado ? '#dc2626' : corStatus }]}>
      
      {/* ========================================== */}
      {/* PARTE VISÍVEL (SEMPRE ABERTA) */}
      {/* ========================================== */}
      <TouchableOpacity 
        style={styles.areaPrincipal} 
        activeOpacity={0.6} 
        onPress={() => setExpandido(!expandido)}
      >
        <View style={styles.headerRow}>
          <Text style={styles.nomeCliente} numberOfLines={1}>{item.cliente_nome}</Text>
          <Feather name={expandido ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
        </View>

        <Text style={styles.nomePeca} numberOfLines={1}>{item.kit_nome}</Text>

        <View style={styles.infoBadgeRow}>
          {estaAtrasado ? (
            <View style={[styles.badge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <Text style={[styles.badgeText, { color: '#dc2626' }]}>🚨 ATRASADO</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: bgStatus, borderColor: borderColor }]}>
              <Text style={[styles.badgeText, { color: corStatus }]}>{item.status || 'Pendente'}</Text>
            </View>
          )}

          {item.medidas_costureira && item.medidas_costureira.trim() !== '' && (
            <View style={[styles.badge, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
              <Text style={[styles.badgeText, { color: '#9333ea' }]}>✂️ AJUSTES</Text>
            </View>
          )}
        </View>

        <Text style={styles.datasTexto}>
          <Feather name="calendar" size={13} color="#ea580c" /> {item.data_retirada}  →  {item.data_devolucao}
        </Text>
      </TouchableOpacity>

      {/* ========================================== */}
      {/* PARTE EXPANSÍVEL (FINANCEIRO + COSTUREIRA + BOTÃO) */}
      {/* ========================================== */}
      {expandido && (
        <View style={styles.areaExpandida}>
          
          {/* BLOCO FINANCEIRO */}
          <View style={styles.blocoDetalhe}>
            <Text style={styles.tituloDetalhe}>Resumo Financeiro</Text>
            
            <View style={styles.linhaFinanceira}>
              <Text style={styles.textoFinLabel}>Valor Total:</Text>
              <Text style={styles.textoFinValor}>{formatarMoeda(valorTotal)} ({item.forma_pagamento || 'N/A'})</Text>
            </View>
            
            <View style={styles.linhaFinanceira}>
              <Text style={styles.textoFinLabel}>Sinal / Pago:</Text>
              <Text style={styles.textoFinValor}>{formatarMoeda(valorPago)}</Text>
            </View>

            {valorPendente > 0 ? (
              <View style={[styles.linhaFinanceira, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#fed7aa' }]}>
                <Text style={[styles.textoFinLabel, { color: '#c2410c', fontWeight: 'bold' }]}>Falta Pagar:</Text>
                <Text style={[styles.textoFinValor, { color: '#c2410c', fontWeight: 'bold' }]}>{formatarMoeda(valorPendente)}</Text>
              </View>
            ) : (
              <View style={[styles.linhaFinanceira, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#bbf7d0' }]}>
                <Text style={[styles.textoFinLabel, { color: '#15803d', fontWeight: 'bold' }]}>Status do Pagamento:</Text>
                <Text style={[styles.textoFinValor, { color: '#15803d', fontWeight: 'bold' }]}>✅ Totalmente Quitado</Text>
              </View>
            )}

            {/* MULTAS (Só mostra se houver) */}
            {item.valor_multa > 0 && (
              <View style={[styles.alertaMulta, 
                item.status_multa === 'Recebida' ? { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' } :
                item.status_multa === 'Cancelada' ? { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' } :
                { backgroundColor: '#fee2e2', borderColor: '#fecaca' }
              ]}>
                <Text style={[styles.textoMulta, 
                  item.status_multa === 'Recebida' ? { color: '#166534' } :
                  item.status_multa === 'Cancelada' ? { color: '#4b5563', textDecorationLine: 'line-through' } :
                  { color: '#991b1b' }
                ]}>
                  Multa ({item.status_multa}): {formatarMoeda(item.valor_multa)}
                </Text>
              </View>
            )}
          </View>

          {/* BLOCO COSTUREIRA (Só mostra se houver anotações) */}
          {item.medidas_costureira && item.medidas_costureira.trim() !== '' && (
            <View style={[styles.blocoDetalhe, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
              <Text style={[styles.tituloDetalhe, { color: '#7e22ce' }]}>Anotações para Costureira</Text>
              <Text style={styles.textoCostureira}>{item.medidas_costureira}</Text>
            </View>
          )}

          {/* BOTÃO PARA ABRIR O MENU DE OPÇÕES (Mudar Status, WhatsApp, Editar, etc) */}
          <TouchableOpacity style={styles.btnGerir} onPress={onPressOpcoes}>
            <Feather name="settings" size={18} color="#fff" />
            <Text style={styles.btnGerirText}>Gerir este Aluguel</Text>
          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderRightColor: '#f3f4f6',
    borderTopColor: '#f3f4f6',
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  areaPrincipal: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nomeCliente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  nomePeca: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 10,
  },
  infoBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  datasTexto: {
    fontSize: 13,
    color: '#ea580c',
    fontWeight: '600',
  },
  
  // ÁREA EXPANDIDA
  areaExpandida: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  blocoDetalhe: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  tituloDetalhe: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  linhaFinanceira: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  textoFinLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  textoFinValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  alertaMulta: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  textoMulta: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoCostureira: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  
  btnGerir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827', // Fundo bem escuro e profissional
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnGerirText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  }
});