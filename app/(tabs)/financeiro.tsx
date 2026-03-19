import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { escutarAlugueres } from '../../services/agendaService';
import { adicionarDespesa, escutarDespesas, excluirDespesa } from '../../services/financeiroService';
import { useAuth } from '../_layout'; // 👈 1. IMPORTAMOS A CENTRAL

const formatarMoeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

const mascaraMoedaInput = (texto: string) => {
  let num = texto.replace(/\D/g, '');
  if (!num) return '';
  num = (parseInt(num, 10) / 100).toFixed(2);
  return num.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
};

export default function FinanceiroScreen() {
  const { user } = useAuth(); // 👈 2. PUXAMOS O CRACHÁ DO UTILIZADOR LOGADO

  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [filtroOperador, setFiltroOperador] = useState('Todos');

  const [modalRetiradaVisible, setModalRetiradaVisible] = useState(false);
  const [descRetirada, setDescRetirada] = useState('');
  const [valorRetirada, setValorRetirada] = useState('');
  const [formaRetirada, setFormaRetirada] = useState('Dinheiro');

  useEffect(() => {
    let carregados = 0;
    const checkLoading = () => { carregados++; if(carregados === 2) setLoading(false); };

    const unsubAlugueres = escutarAlugueres((dados: any[]) => { setAlugueres(dados || []); checkLoading(); }, (e: any) => checkLoading());
    const unsubDespesas = escutarDespesas((dados: any[]) => { setDespesas(dados || []); checkLoading(); }, (e: any) => checkLoading());
    
    return () => { if (unsubAlugueres) unsubAlugueres(); if (unsubDespesas) unsubDespesas(); };
  }, []);

  const dataFiltroStr = `${String(dataFiltro.getDate()).padStart(2, '0')}/${String(dataFiltro.getMonth() + 1).padStart(2, '0')}/${dataFiltro.getFullYear()}`;

  const handleSalvarRetirada = async () => {
    if (!descRetirada || !valorRetirada) {
      Alert.alert("Atenção", "Preencha a descrição e o valor da retirada.");
      return;
    }

    const valorNumerico = Number(valorRetirada.replace(/\./g, '').replace(',', '.'));
    
    await adicionarDespesa({
      descricao: descRetirada,
      valor: valorNumerico,
      forma_pagamento: formaRetirada, 
      data: dataFiltroStr, 
      // 👇 3. CARIMBAMOS O E-MAIL DO UTILIZADOR NA DESPESA!
      operador: user?.email || 'Usuário Não Identificado' 
    });

    setDescRetirada('');
    setValorRetirada('');
    setModalRetiradaVisible(false);
  };

  const confirmarExclusaoDespesa = (id: string, descricao: string) => {
    Alert.alert("Excluir Retirada", `Tem certeza que deseja apagar o registro de "${descricao}"? O valor voltará para o caixa.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirDespesa(id) }
    ]);
  };

  // ==========================================
  // MOTOR DE FECHO DE CAIXA
  // ==========================================
  let totalPix = 0; let totalDinheiro = 0; let totalCartao = 0;
  let totalMultasArrecadadas = 0; let totalRetiradas = 0;
  
  let caixaPorOperador: any = {};
  
  let todasMovimentacoes: any[] = [];
  let operadoresSet = new Set<string>();

  // 1. PROCESSAR AS ENTRADAS (Alugueres e Multas)
  alugueres.forEach(alug => {
    if (alug.status === 'Cancelado') return;

    const valorAluguel = Number(alug.valor_aluguel) || 0;
    const valorPago = Number(alug.valor_pago) || 0;
    const valorMulta = Number(alug.valor_multa) || 0;
    const forma = alug.forma_pagamento;
    // Aqui ele já vai ler o criado_por automaticamente dos novos alugueres!
    const operador = alug.entregue_por || alug.criado_por || 'Usuário Não Identificado';

    if (!caixaPorOperador[operador]) caixaPorOperador[operador] = { dinheiro: 0, pix: 0, cartao: 0, multas: 0, total: 0 };

    let dataEntradaCaixa = alug.data_retirada;
    if (alug.data_entrega_real) {
      const dataReal = new Date(alug.data_entrega_real);
      dataEntradaCaixa = `${String(dataReal.getDate()).padStart(2, '0')}/${String(dataReal.getMonth() + 1).padStart(2, '0')}/${dataReal.getFullYear()}`;
    }

    const pagamentoConfirmado = alug.status === 'Entregue' || alug.status === 'Devolvido';

    if (dataEntradaCaixa === dataFiltroStr && pagamentoConfirmado) {
      if (forma === 'Pix') { totalPix += valorPago; caixaPorOperador[operador].pix += valorPago; }
      else if (forma === 'Cartão') { totalCartao += valorPago; caixaPorOperador[operador].cartao += valorPago; }
      else { totalDinheiro += valorPago; caixaPorOperador[operador].dinheiro += valorPago; }

      caixaPorOperador[operador].total += valorPago;

      if (valorPago > 0) {
        todasMovimentacoes.push({
          id: `alug_${alug.id}`,
          tipo: 'Entrada',
          titulo: `Aluguel • ${alug.cliente_nome}`,
          operador: operador,
          forma: forma || 'Dinheiro',
          valor: valorPago,
          isSaida: false
        });
        operadoresSet.add(operador);
      }
    }

    let dataMultaCaixa = alug.data_devolucao;
    if (alug.data_recebimento_multa) {
      const d = new Date(alug.data_recebimento_multa);
      dataMultaCaixa = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } else if (alug.data_devolucao_real) {
      const d = new Date(alug.data_devolucao_real);
      dataMultaCaixa = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    if (dataMultaCaixa === dataFiltroStr && alug.status_multa === 'Recebida' && valorMulta > 0) {
      totalMultasArrecadadas += valorMulta;
      caixaPorOperador[operador].multas += valorMulta;
      caixaPorOperador[operador].total += valorMulta;

      todasMovimentacoes.push({
        id: `multa_${alug.id}`,
        tipo: 'Multa',
        titulo: `Multa • ${alug.cliente_nome}`,
        operador: operador,
        forma: 'Caixa',
        valor: valorMulta,
        isSaida: false
      });
      operadoresSet.add(operador);
    }
  });

  // 2. PROCESSAR AS SAÍDAS (Retiradas) NO EXTRATO
  despesas.forEach(desp => {
    if (desp.data === dataFiltroStr) {
      const valorSaida = Number(desp.valor) || 0;
      totalRetiradas += valorSaida;
      const op = desp.operador || 'Usuário Não Identificado';

      if (desp.forma_pagamento === 'Pix') totalPix -= valorSaida;
      else if (desp.forma_pagamento === 'Cartão') totalCartao -= valorSaida;
      else totalDinheiro -= valorSaida; 

      todasMovimentacoes.push({
        id: desp.id,
        tipo: 'Saída',
        titulo: desp.descricao,
        operador: op,
        forma: desp.forma_pagamento,
        valor: valorSaida,
        isSaida: true,
        podeExcluir: true
      });
      operadoresSet.add(op);
    }
  });

  const totalEntradas = totalPix + totalDinheiro + totalCartao + totalMultasArrecadadas + totalRetiradas; 
  const totalEmCaixa = totalPix + totalDinheiro + totalCartao + totalMultasArrecadadas;

  const listaOperadores = ['Todos', ...Array.from(operadoresSet)];
  
  if (filtroOperador !== 'Todos' && !operadoresSet.has(filtroOperador)) {
    setFiltroOperador('Todos');
  }

  const movimentacoesVisiveis = filtroOperador === 'Todos' 
    ? todasMovimentacoes 
    : todasMovimentacoes.filter(m => m.operador === filtroOperador);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <Text style={styles.headerTitle}>Fecho de Caixa</Text>
          <TouchableOpacity style={styles.btnNovaRetirada} onPress={() => setModalRetiradaVisible(true)}>
            <Feather name="minus-circle" size={16} color="#fff" />
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4}}>Retirada</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color="#ea580c" />
          <Text style={styles.dateSelectorText}>Data: {dataFiltroStr}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker value={dataFiltro} mode="date" onChange={(event, selectedDate) => { setShowDatePicker(false); if (selectedDate) setDataFiltro(selectedDate); }} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.resumoGeral}>
            <Text style={styles.resumoGeralTexto}>Saldo Líquido do Dia</Text>
            <Text style={styles.resumoGeralValor}>{formatarMoeda(totalEmCaixa)}</Text>
            
            <View style={{flexDirection: 'row', gap: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12}}>
              <Text style={{color: '#dcfce7', fontSize: 12}}>Entradas: {formatarMoeda(totalEntradas)}</Text>
              <Text style={{color: '#fee2e2', fontSize: 12}}>Saídas: {formatarMoeda(totalRetiradas)}</Text>
            </View>
          </View>

          <View style={styles.metodosGrid}>
            <View style={[styles.metodoCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#bbf7d0' }]}><Feather name="dollar-sign" size={16} color="#16a34a" /></View>
              <Text style={styles.metodoLabel}>Dinheiro</Text>
              <Text style={[styles.metodoValor, { color: '#15803d' }]}>{formatarMoeda(totalDinheiro)}</Text>
            </View>

            <View style={[styles.metodoCard, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#bae6fd' }]}><Feather name="smartphone" size={16} color="#0284c7" /></View>
              <Text style={styles.metodoLabel}>PIX</Text>
              <Text style={[styles.metodoValor, { color: '#0369a1' }]}>{formatarMoeda(totalPix)}</Text>
            </View>

            <View style={[styles.metodoCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
              <View style={[styles.metodoIcone, { backgroundColor: '#e9d5ff' }]}><Feather name="credit-card" size={16} color="#9333ea" /></View>
              <Text style={styles.metodoLabel}>Cartão</Text>
              <Text style={[styles.metodoValor, { color: '#7e22ce' }]}>{formatarMoeda(totalCartao)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🧾 Extrato de Movimentações</Text>
            </View>

            {listaOperadores.length > 1 && (
              <View style={[styles.pickerContainer, { marginBottom: 16, backgroundColor: '#fff', borderColor: '#e5e7eb' }]}>
                <Picker selectedValue={filtroOperador} onValueChange={setFiltroOperador} style={{ height: 50 }}>
                  {listaOperadores.map(op => (
                    <Picker.Item key={op} label={op === 'Todos' ? 'Todos os Funcionários' : `Exibir apenas: ${op}`} value={op} />
                  ))}
                </Picker>
              </View>
            )}
            
            {movimentacoesVisiveis.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma movimentação registada nesta data.</Text>
            ) : (
              movimentacoesVisiveis.map((mov) => (
                <View key={mov.id} style={[styles.movItem, mov.isSaida ? { borderColor: '#fecaca', backgroundColor: '#fff' } : { borderColor: '#bbf7d0', backgroundColor: '#fff' }]}>
                  <View style={[styles.movIcon, mov.isSaida ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#dcfce7' }]}>
                    <Feather name={mov.isSaida ? "arrow-down-right" : "arrow-up-right"} size={20} color={mov.isSaida ? "#dc2626" : "#16a34a"} />
                  </View>
                  <View style={styles.movInfo}>
                    <Text style={styles.movDesc} numberOfLines={1}>{mov.titulo}</Text>
                    <Text style={styles.movMetodo}>{mov.operador} • {mov.forma}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={[styles.movValor, mov.isSaida ? { color: '#dc2626' } : { color: '#16a34a' }]}>
                      {mov.isSaida ? '-' : '+'} {formatarMoeda(Number(mov.valor))}
                    </Text>
                    {mov.podeExcluir && (
                      <TouchableOpacity onPress={() => confirmarExclusaoDespesa(mov.id, mov.titulo)} style={{marginTop: 6}}>
                        <Text style={{color: '#9ca3af', fontSize: 12, textDecorationLine: 'underline'}}>Excluir Saída</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <Modal visible={modalRetiradaVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleOpcoes}>Registrar Retirada</Text>
            
            <Text style={styles.label}>Motivo / Descrição *</Text>
            <TextInput style={styles.input} value={descRetirada} onChangeText={setDescRetirada} placeholder="Ex: Pagamento da Costureira" />

            <Text style={styles.label}>Valor (R$) *</Text>
            <TextInput style={styles.input} value={valorRetirada} onChangeText={(t) => setValorRetirada(mascaraMoedaInput(t))} placeholder="R$ 0,00" keyboardType="numeric" />

            <Text style={styles.label}>O dinheiro saiu de onde? *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={formaRetirada} onValueChange={setFormaRetirada} style={{ height: 50 }}>
                <Picker.Item label="Gaveta (Dinheiro Físico)" value="Dinheiro" />
                <Picker.Item label="Conta Bancária (PIX)" value="Pix" />
                <Picker.Item label="Máquina de Cartão" value="Cartão" />
              </Picker>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#dc2626' }]} onPress={handleSalvarRetirada}>
              <Text style={styles.saveButtonText}>Confirmar Retirada</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalRetiradaVisible(false)} style={{ marginTop: 20, padding: 10 }}>
              <Text style={{ color: '#6b7280', textAlign: 'center', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  btnNovaRetirada: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ffedd5', gap: 8 },
  dateSelectorText: { color: '#ea580c', fontWeight: 'bold', fontSize: 16 },

  resumoGeral: { backgroundColor: '#111827', margin: 20, padding: 24, borderRadius: 20, alignItems: 'center', elevation: 4 },
  resumoGeralTexto: { color: '#9ca3af', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  resumoGeralValor: { color: '#fff', fontSize: 40, fontWeight: '900' },

  metodosGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 15 },
  metodoCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  metodoIcone: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  metodoLabel: { fontSize: 11, fontWeight: 'bold', color: '#6b7280', marginBottom: 4, textAlign: 'center', textTransform: 'uppercase' },
  metodoValor: { fontSize: 13, fontWeight: '900', textAlign: 'center' },

  section: { paddingHorizontal: 20, marginTop: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 10, fontSize: 14, fontStyle: 'italic' },
  
  movItem: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, alignItems: 'center' },
  movIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  movInfo: { flex: 1 },
  movDesc: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  movMetodo: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  movValor: { fontSize: 16, fontWeight: '900' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalTitleOpcoes: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#f9fafb', borderRadius: 12, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, overflow: 'hidden' },
  saveButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});