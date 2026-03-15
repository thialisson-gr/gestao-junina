import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { escutarKits } from '../services/acervoService';
import { escutarClientes } from '../services/clienteService';

const formatarMoeda = (texto: string) => {
  let num = texto.replace(/\D/g, ''); 
  if (!num) return '';
  num = (parseInt(num, 10) / 100).toFixed(2); 
  return num.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); 
};

const parseDataBR = (dataStr: string) => {
  if(!dataStr || !dataStr.includes('/')) return new Date(0);
  const partes = dataStr.split('/');
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

export default function AluguerModal({ visible, onClose, onSave, alugueresExistentes }: any) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  
  // ==========================================
  // NOVOS ESTADOS PARA A BUSCA DE CLIENTES
  // ==========================================
  const [clienteId, setClienteId] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  
  // Funil de Acervo
  const [filtroSecao, setFiltroSecao] = useState(''); 
  const [filtroGenero, setFiltroGenero] = useState('Todos'); 
  const [kitId, setKitId] = useState(''); 

  // Datas e Financeiro
  const [dataRetirada, setDataRetirada] = useState('');
  const [dateObjectRetirada, setDateObjectRetirada] = useState(new Date());
  const [showPickerRetirada, setShowPickerRetirada] = useState(false);

  const [dataDevolucao, setDataDevolucao] = useState('');
  const [dateObjectDevolucao, setDateObjectDevolucao] = useState(new Date());
  const [showPickerDevolucao, setShowPickerDevolucao] = useState(false);

  const [valorAluguel, setValorAluguel] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');

  useEffect(() => {
    if (visible) {
      const unsubC = escutarClientes((d: any) => setClientes(d || []), (e: any) => console.log(e));
      const unsubK = escutarKits((d: any) => setKits(d || []), (e: any) => console.log(e));
      return () => { if(unsubC) unsubC(); if(unsubK) unsubK(); };
    }
  }, [visible]);

  useEffect(() => { setKitId(''); }, [filtroSecao, filtroGenero]);

  // Lógica de Filtro dos Clientes
  const clientesFiltrados = clientes.filter(c => 
    c && c.id && c.responsavel_nome && c.responsavel_nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  // Lógica do Funil de Peças
  const anosTemasUnicos = [...new Set(kits
    .filter(k => k && k.categoria !== 'Acessório' && k.categoria !== 'Acessorio' && k.tipo !== 'Acessório')
    .map(k => k.ano_tema || k.tema)
    .filter(t => t)
  )];

  const kitsFiltrados = kits.filter(k => {
    if (!k) return false;

    // === NOVA REGRA DE BLINDAGEM ===
    // Se a peça for antiga e não tiver status, assumimos 'Disponível'
    const statusPeca = k.status_interno || 'Disponível';
    if (statusPeca !== 'Disponível') return false; // Esconde tudo o que estiver na costureira/lavandaria!
    // ===============================

    if (filtroSecao) {
      const isAcessorio = k.categoria === 'Acessório' || k.categoria === 'Acessorio' || k.tipo === 'Acessório';
      if (filtroSecao === 'Acessorio') { if (!isAcessorio) return false; } 
      else { if (isAcessorio) return false; if ((k.ano_tema || k.tema) !== filtroSecao) return false; }
    }
    if (filtroGenero !== 'Todos') {
      const generoKit = k.genero ? k.genero.toLowerCase() : '';
      if (filtroGenero === 'Masculino' && generoKit !== 'masculino') return false;
      if (filtroGenero === 'Feminino' && generoKit !== 'feminino') return false;
    }
    return true;
  });

  const confirmar = () => {
    // Se o cliente não foi escolhido na lista, bloqueia
    if (!clienteId) {
      Alert.alert("Atenção", "Por favor, selecione um cliente da lista clicando no nome dele.");
      return;
    }
    if (!kitId || !dataRetirada || !dataDevolucao) {
      Alert.alert("Atenção", "Preencha a peça e as datas.");
      return;
    }

    const conflito = (alugueresExistentes || []).find((alug: any) => {
      if (!alug || !alug.id) return false;
      if (alug.kit_id !== kitId) return false;
      if (alug.status === 'Devolvido' || alug.status === 'Cancelado') return false; 
      const inicioA = dateObjectRetirada; const fimA = dateObjectDevolucao;
      const inicioB = parseDataBR(alug.data_retirada); const fimB = parseDataBR(alug.data_devolucao);
      return (inicioA <= fimB && fimA >= inicioB);
    });

    if (conflito) {
      Alert.alert("Peça Indisponível! ⚠️", `Esta peça já está reservada para "${conflito.cliente_nome}" no período de ${conflito.data_retirada} até ${conflito.data_devolucao}.`);
      return; 
    }

    const c = clientes.find(item => item && item.id === clienteId);
    const k = kits.find(item => item && item.id === kitId);

    const numAluguel = Number(valorAluguel.replace(/\./g, '').replace(',', '.'));
    const numPago = Number(valorPago.replace(/\./g, '').replace(',', '.'));

    onSave({
      cliente_id: clienteId,
      cliente_nome: c?.responsavel_nome || "Sem nome",
      // 👇 ADICIONE ESTA LINHA (Ele vai tentar achar o campo telefone, celular ou whatsapp)
      cliente_telefone: c?.responsavel_whatsapp || "", 
      kit_id: kitId,
      kit_nome: `${k?.id_etiqueta ? '['+k.id_etiqueta+'] ' : ''}${k?.personagem || k?.descricao || "Sem nome"}`,
      data_retirada: dataRetirada,
      data_devolucao: dataDevolucao,
      status: 'Pendente',
      valor_aluguel: numAluguel || 0,
      valor_pago: numPago || 0,
      forma_pagamento: formaPagamento,
      valor_multa: 0,
      status_multa: 'Sem Multa'
    });
    
    // Limpar tudo
    setClienteId(''); setBuscaCliente(''); setMostrarListaClientes(false);
    setKitId(''); setDataRetirada(''); setDataDevolucao('');
    setValorAluguel(''); setValorPago(''); setFormaPagamento(''); 
    setFiltroSecao(''); setFiltroGenero('Todos');
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Aluguer</Text>
              
              {/* ========================================== */}
              {/* CAMPO DE BUSCA DE CLIENTES INTELIGENTE */}
              {/* ========================================== */}
              <Text style={styles.sectionTitle}>1. Buscar Cliente</Text>
              <View style={{ zIndex: 10 }}>
                <View style={styles.searchContainer}>
                  <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Digite o nome do cliente..."
                    value={buscaCliente}
                    onChangeText={(texto) => {
                      setBuscaCliente(texto);
                      setClienteId(''); // Apaga o ID se o utilizador alterar o texto
                      setMostrarListaClientes(true); // Mostra a lista ao digitar
                    }}
                    onFocus={() => setMostrarListaClientes(true)}
                  />
                  {/* Botão para limpar a busca */}
                  {buscaCliente.length > 0 && (
                    <TouchableOpacity onPress={() => { setBuscaCliente(''); setClienteId(''); setMostrarListaClientes(false); }}>
                      <Feather name="x-circle" size={20} color="#9ca3af" style={{ padding: 10 }} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Lista Suspensa (Aparece apenas quando digita) */}
                {mostrarListaClientes && buscaCliente.length > 0 && (
                  <View style={styles.listaBuscaContainer}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.itemBusca}
                            onPress={() => {
                              setClienteId(c.id); // Guarda o ID verdadeiro
                              setBuscaCliente(c.responsavel_nome); // Preenche o Input com o nome lindo
                              setMostrarListaClientes(false); // Esconde a lista
                              Keyboard.dismiss(); // Esconde o teclado
                            }}
                          >
                            <Text style={styles.itemBuscaTexto}>{c.responsavel_nome}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={{ padding: 15, color: '#9ca3af', textAlign: 'center' }}>Nenhum cliente encontrado.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>2. Encontrar Peça no Acervo</Text>
              
              <View style={styles.pickerContainer}>
                <Picker selectedValue={filtroSecao} onValueChange={setFiltroSecao} style={styles.picker}>
                  <Picker.Item label="Escolha a Coleção ou Acessórios..." value="" />
                  <Picker.Item label="🛍️ Apenas Acessórios" value="Acessorio" />
                  {anosTemasUnicos.map(at => <Picker.Item key={at as string} label={`👗 Coleção: ${at}`} value={at as string} />)}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={filtroGenero} onValueChange={setFiltroGenero} style={styles.picker}>
                  <Picker.Item label="Qualquer Gênero" value="Todos" />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Feminino" value="Feminino" />
                </Picker>
              </View>

              <View style={[styles.pickerContainer, { borderColor: '#ea580c', borderWidth: 1.5 }]}>
                <Picker selectedValue={kitId} onValueChange={setKitId} style={styles.picker}>
                  <Picker.Item label={`Escolha a Peça (${kitsFiltrados.length} encontradas)`} value="" />
                  {kitsFiltrados.map(k => (
                    <Picker.Item 
                      key={k.id} 
                      label={`${k.id_etiqueta ? '['+k.id_etiqueta+'] ' : ''}${k.personagem || k.descricao || 'Sem descrição'}`} 
                      value={k.id} 
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.datePickerButton, {flex: 1, marginRight: 8}]} onPress={() => setShowPickerRetirada(true)}>
                  <Text style={{ color: dataRetirada ? '#111827' : '#9ca3af', fontSize: 14 }}>{dataRetirada ? `Sai: ${dataRetirada}` : "Retirada"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.datePickerButton, {flex: 1, marginLeft: 8}]} onPress={() => setShowPickerDevolucao(true)}>
                  <Text style={{ color: dataDevolucao ? '#111827' : '#9ca3af', fontSize: 14 }}>{dataDevolucao ? `Volta: ${dataDevolucao}` : "Devolução"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Valores (R$)</Text>
              
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Total" keyboardType="numeric" value={valorAluguel} onChangeText={(t) => setValorAluguel(formatarMoeda(t))} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 8}]} placeholder="Pago" keyboardType="numeric" value={valorPago} onChangeText={(t) => setValorPago(formatarMoeda(t))} />
              </View>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={formaPagamento} onValueChange={setFormaPagamento} style={styles.picker}>
                  <Picker.Item label="Forma de Pagamento..." value="" />
                  <Picker.Item label="Pix" value="Pix" />
                  <Picker.Item label="Dinheiro" value="Dinheiro" />
                  <Picker.Item label="Cartão" value="Cartão" />
                </Picker>
              </View>

              <TouchableOpacity style={styles.btnSalvar} onPress={confirmar}>
                <Text style={styles.btnSalvarText}>Salvar Aluguer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                onClose();
                setBuscaCliente(''); setMostrarListaClientes(false);
              }} style={styles.btnCancelar}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {showPickerRetirada && <DateTimePicker value={dateObjectRetirada} mode="date" onChange={(e, d) => { setShowPickerRetirada(false); if(d){ setDateObjectRetirada(d); setDataRetirada(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);} }} />}
      {showPickerDevolucao && <DateTimePicker value={dateObjectDevolucao} mode="date" onChange={(e, d) => { setShowPickerDevolucao(false); if(d){ setDateObjectDevolucao(d); setDataDevolucao(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);} }} />}
    </>
  );
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6b7280', marginTop: 10, marginBottom: 8, textTransform: 'uppercase' },
  pickerContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 16 },
  picker: { height: 50, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  datePickerButton: { justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 14, backgroundColor: '#f9fafb', borderRadius: 8 },
  input: { borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 8, fontSize: 16 },
  btnSalvar: { backgroundColor: '#ea580c', padding: 16, alignItems: 'center', borderRadius: 12, marginTop: 16 },
  btnSalvarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancelar: { marginTop: 16, padding: 12 },
  btnCancelarText: { color: '#ef4444', textAlign: 'center', fontWeight: '600' },
  
  // Estilos da Busca Inteligente
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8 },
  searchIcon: { paddingLeft: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: '#111827' },
  listaBuscaContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, maxHeight: 150, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  itemBusca: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemBuscaTexto: { fontSize: 16, color: '#111827' }
});