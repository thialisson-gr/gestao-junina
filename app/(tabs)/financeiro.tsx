import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { escutarAlugueres } from '../../services/agendaService';

const formatarMoeda = (valor: number) => {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
};

export default function FinanceiroScreen() {
  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 Estado para a escolha da Data exata!
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const unsub = escutarAlugueres(
      (dados: any[]) => { setAlugueres(dados || []); setLoading(false); },
      (erro: any) => { console.log(erro); setLoading(false); }
    );
    return () => { if (unsub) unsub(); };
  }, []);

  // Formata a data escolhida para comparar com o Firebase (DD/MM/YYYY)
  const dataFiltroStr = `${String(dataFiltro.getDate()).padStart(2, '0')}/${String(dataFiltro.getMonth() + 1).padStart(2, '0')}/${dataFiltro.getFullYear()}`;

  // ==========================================
  // MOTOR DE FECHO DE CAIXA (Com separação por Operador)
  // ==========================================
  let totalPix = 0;
  let totalDinheiro = 0;
  let totalCartao = 0;
  let totalMultasArrecadadas = 0;
  
  // Objeto para separar o dinheiro por quem recebeu
  let caixaPorOperador: any = {};
  let alertasDeCaixa: any[] = [];

  alugueres.forEach(alug => {
    if (alug.status === 'Cancelado') return;

    const valorAluguel = Number(alug.valor_aluguel) || 0;
    const valorPago = Number(alug.valor_pago) || 0;
    const valorMulta = Number(alug.valor_multa) || 0;
    const forma = alug.forma_pagamento;
    
    // 👇 Lê quem fez a operação (Se não tiver, agrupa em "Não Identificado")
    const operador = alug.atendente_nome || 'Usuário Não Identificado';

    // Cria a "gaveta" do operador se ela ainda não existir
    if (!caixaPorOperador[operador]) {
      caixaPorOperador[operador] = { dinheiro: 0, pix: 0, cartao: 0, multas: 0, total: 0 };
    }

    // 1. ANÁLISE DE RETIRADAS
    if (alug.data_retirada === dataFiltroStr) {
      const valorAAdicionar = valorPago;
      
      if (forma === 'Pix') { totalPix += valorAAdicionar; caixaPorOperador[operador].pix += valorAAdicionar; }
      else if (forma === 'Cartão') { totalCartao += valorAAdicionar; caixaPorOperador[operador].cartao += valorAAdicionar; }
      else { totalDinheiro += valorAAdicionar; caixaPorOperador[operador].dinheiro += valorAAdicionar; }

      caixaPorOperador[operador].total += valorAAdicionar;

      const faltaPagar = valorAluguel - valorPago;
      if (faltaPagar > 0) {
        alertasDeCaixa.push({ 
          ...alug, tipoAlerta: 'Falta Pagamento', valorAlerta: faltaPagar, operador,
          mensagem: `Deixou ${formatarMoeda(faltaPagar)} pendentes.`
        });
      }
    }

    // 2. ANÁLISE DE DEVOLUÇÕES E MULTAS
    if (alug.data_devolucao === dataFiltroStr) {
      if (alug.status_multa === 'Recebida') {
        totalMultasArrecadadas += valorMulta;
        caixaPorOperador[operador].multas += valorMulta;
        caixaPorOperador[operador].total += valorMulta;
      }

      if (valorMulta > 0 && alug.status_multa !== 'Recebida' && alug.status_multa !== 'Cancelada') {
        alertasDeCaixa.push({ 
          ...alug, tipoAlerta: 'Multa Pendente', valorAlerta: valorMulta, operador,
          mensagem: `Atrasou e não pagou a multa de ${formatarMoeda(valorMulta)}.`
        });
      }
    }
  });

  alertasDeCaixa.sort((a, b) => b.valorAlerta - a.valorAlerta);
  const totalEmCaixa = totalPix + totalDinheiro + totalCartao + totalMultasArrecadadas;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fecho de Caixa</Text>
        
        {/* 👇 BOTÃO PARA ESCOLHER A DATA */}
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color="#ea580c" />
          <Text style={styles.dateSelectorText}>
            Data: {dataFiltroStr}
          </Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dataFiltro}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDataFiltro(selectedDate);
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.resumoGeral}>
            <Text style={styles.resumoGeralTexto}>Total Entradas do Dia</Text>
            <Text style={styles.resumoGeralValor}>{formatarMoeda(totalEmCaixa)}</Text>
          </View>

          <View style={styles.metodosGrid}>
            <View style={[styles.metodoCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#bbf7d0' }]}>
                <Feather name="dollar-sign" size={18} color="#16a34a" />
              </View>
              <Text style={styles.metodoLabel}>Gaveta (Dinheiro)</Text>
              <Text style={[styles.metodoValor, { color: '#15803d' }]}>{formatarMoeda(totalDinheiro)}</Text>
            </View>

            <View style={[styles.metodoCard, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#bae6fd' }]}>
                <Feather name="smartphone" size={18} color="#0284c7" />
              </View>
              <Text style={styles.metodoLabel}>Banco (PIX)</Text>
              <Text style={[styles.metodoValor, { color: '#0369a1' }]}>{formatarMoeda(totalPix)}</Text>
            </View>
          </View>

          <View style={styles.metodosGrid}>
            <View style={[styles.metodoCard, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#fde68a' }]}>
                <Feather name="credit-card" size={18} color="#d97706" />
              </View>
              <Text style={styles.metodoLabel}>Máquina (Cartão)</Text>
              <Text style={[styles.metodoValor, { color: '#b45309' }]}>{formatarMoeda(totalCartao)}</Text>
            </View>

            <View style={[styles.metodoCard, { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#e9d5ff' }]}>
                <Feather name="alert-circle" size={18} color="#9333ea" />
              </View>
              <Text style={styles.metodoLabel}>Multas (Dinheiro Extra)</Text>
              <Text style={[styles.metodoValor, { color: '#7e22ce' }]}>{formatarMoeda(totalMultasArrecadadas)}</Text>
            </View>
          </View>

          {/* ========================================== */}
          {/* 👇 NOVA SECÇÃO: CAIXA POR OPERADOR */}
          {/* ========================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍💻 Recebido por Funcionário</Text>
            
            {Object.keys(caixaPorOperador).length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma movimentação neste dia.</Text>
            ) : (
              Object.keys(caixaPorOperador).map((operadorNome) => (
                <View key={operadorNome} style={styles.operadorCard}>
                  <View style={styles.operadorHeader}>
                    <Text style={styles.operadorName}>{operadorNome}</Text>
                    <Text style={styles.operadorTotal}>{formatarMoeda(caixaPorOperador[operadorNome].total)}</Text>
                  </View>
                  <View style={styles.operadorDetalhes}>
                    <Text style={styles.operadorDetalheTexto}>Dinheiro: {formatarMoeda(caixaPorOperador[operadorNome].dinheiro)}</Text>
                    <Text style={styles.operadorDetalheTexto}>PIX: {formatarMoeda(caixaPorOperador[operadorNome].pix)}</Text>
                    <Text style={styles.operadorDetalheTexto}>Cartão: {formatarMoeda(caixaPorOperador[operadorNome].cartao)}</Text>
                    {caixaPorOperador[operadorNome].multas > 0 && (
                      <Text style={[styles.operadorDetalheTexto, { color: '#7e22ce' }]}>Multas inclusas: {formatarMoeda(caixaPorOperador[operadorNome].multas)}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Alertas do Fecho</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{alertasDeCaixa.length}</Text>
              </View>
            </View>

            {alertasDeCaixa.length === 0 ? (
              <Text style={styles.emptyText}>✅ Sem pendências!</Text>
            ) : (
              alertasDeCaixa.map((item, index) => (
                <TouchableOpacity 
                  key={item.id + index} 
                  style={styles.alertaItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(item.tipoAlerta, `Vá à Agenda e atualize este aluguer.`);
                  }}
                >
                  <View style={[styles.alertaIcon, { backgroundColor: item.tipoAlerta === 'Falta Pagamento' ? '#fee2e2' : '#f3e8ff' }]}>
                    <Feather name={item.tipoAlerta === 'Falta Pagamento' ? "user-x" : "clock"} size={20} color={item.tipoAlerta === 'Falta Pagamento' ? "#dc2626" : "#9333ea"} />
                  </View>
                  
                  <View style={styles.alertaInfo}>
                    <Text style={styles.alertaName}>{item.cliente_nome}</Text>
                    <Text style={styles.alertaMsg}>{item.mensagem}</Text>
                    <Text style={styles.alertaOperador}>Responsável: {item.operador}</Text>
                  </View>
                  
                  <View style={styles.alertaValores}>
                    <Text style={styles.textoFalta}>{item.tipoAlerta === 'Falta Pagamento' ? 'FALTA' : 'MULTA'}</Text>
                    <Text style={[styles.valorFalta, { color: item.tipoAlerta === 'Falta Pagamento' ? "#dc2626" : "#9333ea" }]}>{formatarMoeda(item.valorAlerta)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ffedd5', gap: 8 },
  dateSelectorText: { color: '#ea580c', fontWeight: 'bold', fontSize: 16 },

  resumoGeral: { backgroundColor: '#111827', margin: 20, padding: 24, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  resumoGeralTexto: { color: '#9ca3af', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  resumoGeralValor: { color: '#fff', fontSize: 40, fontWeight: '900' },

  metodosGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  metodoCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  metodoIcone: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metodoLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginBottom: 4, textAlign: 'center' },
  metodoValor: { fontSize: 16, fontWeight: '900', textAlign: 'center' },

  section: { paddingHorizontal: 20, marginTop: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', marginBottom: 10 },
  badgeCount: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },
  
  emptyText: { textAlign: 'center', color: '#16a34a', marginTop: 10, fontSize: 15, fontWeight: '500' },
  
  operadorCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  operadorHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10 },
  operadorName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  operadorTotal: { fontSize: 16, fontWeight: '900', color: '#ea580c' },
  operadorDetalhes: { gap: 4 },
  operadorDetalheTexto: { fontSize: 13, color: '#4b5563' },

  alertaItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', marginBottom: 12 },
  alertaIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertaInfo: { flex: 1 },
  alertaName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  alertaMsg: { fontSize: 11, color: '#6b7280', marginTop: 4, lineHeight: 16 },
  alertaOperador: { fontSize: 10, fontWeight: 'bold', color: '#ea580c', marginTop: 4 },
  
  alertaValores: { alignItems: 'flex-end', marginLeft: 10 },
  textoFalta: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280' },
  valorFalta: { fontSize: 16, fontWeight: '900', marginTop: 2 }
});