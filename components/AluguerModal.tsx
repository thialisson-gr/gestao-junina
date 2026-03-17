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

export default function AluguerModal({ visible, onClose, onSave, alugueresExistentes, aluguerParaEditar, kitInicialId }: any) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  
  const [clienteId, setClienteId] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  
  const [filtroSecao, setFiltroSecao] = useState(''); 
  const [filtroGenero, setFiltroGenero] = useState('Todos'); 
  const [kitIdPicker, setKitIdPicker] = useState(''); 
  
  // 👇 NOVO ESTADO: Lista de Múltiplas Peças
  const [kitsSelecionados, setKitsSelecionados] = useState<any[]>([]);

  const [dataRetirada, setDataRetirada] = useState('');
  const [dateObjectRetirada, setDateObjectRetirada] = useState(new Date());
  const [showPickerRetirada, setShowPickerRetirada] = useState(false);

  const [dataDevolucao, setDataDevolucao] = useState('');
  const [dateObjectDevolucao, setDateObjectDevolucao] = useState(new Date());
  const [showPickerDevolucao, setShowPickerDevolucao] = useState(false);

  const [valorAluguel, setValorAluguel] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [medidasCostureira, setMedidasCostureira] = useState('');

  useEffect(() => {
    if (visible && aluguerParaEditar) {
      setClienteId(aluguerParaEditar.cliente_id || '');
      setBuscaCliente(aluguerParaEditar.cliente_nome || '');
      
      // 👇 RECUPERA A LISTA DE PEÇAS (Suporta o formato novo e o antigo)
      if (aluguerParaEditar.kits_alugados && aluguerParaEditar.kits_alugados.length > 0) {
        setKitsSelecionados(aluguerParaEditar.kits_alugados);
      } else if (aluguerParaEditar.kit_id) {
        setKitsSelecionados([{ id: aluguerParaEditar.kit_id, nome: aluguerParaEditar.kit_nome }]);
      } else {
        setKitsSelecionados([]);
      }

      setDataRetirada(aluguerParaEditar.data_retirada || '');
      setDataDevolucao(aluguerParaEditar.data_devolucao || '');
      setValorAluguel(aluguerParaEditar.valor_aluguel ? String(aluguerParaEditar.valor_aluguel.toFixed(2)).replace('.', ',') : '');
      setFormaPagamento(aluguerParaEditar.forma_pagamento || '');
      setMedidasCostureira(aluguerParaEditar.medidas_costureira || '');
    } else if (visible && !aluguerParaEditar) {
      limparFormulario();
      if (kitInicialId) {
        // Se abriu pelo leitor de código de barras
        const kEncontrado = kits.find(k => k.id === kitInicialId);
        if (kEncontrado) {
          const nomeKit = `${kEncontrado.id_etiqueta ? '['+kEncontrado.id_etiqueta+'] ' : ''}${kEncontrado.personagem || kEncontrado.descricao || 'Sem nome'}`;
          setKitsSelecionados([{ id: kitInicialId, nome: nomeKit }]);
        }
      }
    }
  }, [visible, aluguerParaEditar, kitInicialId, kits]);

  useEffect(() => {
    if (visible) {
      const unsubC = escutarClientes((d: any) => setClientes(d || []), (e: any) => console.log(e));
      const unsubK = escutarKits((d: any) => setKits(d || []), (e: any) => console.log(e));
      return () => { if(unsubC) unsubC(); if(unsubK) unsubK(); };
    }
  }, [visible]);

  useEffect(() => { 
    setKitIdPicker(''); 
  }, [filtroSecao, filtroGenero]);

  const limparFormulario = () => {
    setClienteId(''); setBuscaCliente(''); setMostrarListaClientes(false);
    setKitIdPicker(''); setKitsSelecionados([]); setDataRetirada(''); setDataDevolucao('');
    setValorAluguel(''); setFormaPagamento(''); 
    setFiltroSecao(''); setFiltroGenero('Todos'); setMedidasCostureira('');
  };

  const clientesFiltrados = clientes.filter(c => 
    c && c.id && c.responsavel_nome && c.responsavel_nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  const anosTemasUnicos = [...new Set(kits
    .filter(k => k && k.categoria !== 'Acessório' && k.categoria !== 'Acessorio' && k.tipo !== 'Acessório')
    .map(k => k.ano_tema || k.tema)
    .filter(t => t)
  )];

  const kitsFiltrados = kits.filter(k => {
    if (!k) return false;
    const statusPeca = k.status_interno || 'Ativo';
    if (statusPeca !== 'Ativo') return false;
    
    // Esconde os que já estão na lista de selecionados
    if (kitsSelecionados.some(selecionado => selecionado.id === k.id)) return false;

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

  // 👇 NOVA FUNÇÃO: Adicionar à lista
  const handleAdicionarKit = () => {
    if (!kitIdPicker) return;
    const k = kits.find(item => item.id === kitIdPicker);
    if (k) {
      const nomeKit = `${k.id_etiqueta ? '['+k.id_etiqueta+'] ' : ''}${k.personagem || k.descricao || 'Sem descrição'}`;
      setKitsSelecionados(prev => [...prev, { id: k.id, nome: nomeKit }]);
      setKitIdPicker('');
    }
  };

  // 👇 NOVA FUNÇÃO: Remover da lista
  const handleRemoverKit = (idParaRemover: string) => {
    setKitsSelecionados(prev => prev.filter(k => k.id !== idParaRemover));
  };

  const confirmar = () => {
    if (!clienteId || kitsSelecionados.length === 0 || !dataRetirada || !dataDevolucao || !valorAluguel || !formaPagamento) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos obrigatórios (*). Não se esqueça de adicionar pelo menos uma peça à lista.");
      return;
    }

    // 👇 NOVO DETETIVE DE CONFLITOS (Verifica todas as peças da lista)
    let conflitoEncontrado: any = null;

    for (const meuKit of kitsSelecionados) {
      const conflito = (alugueresExistentes || []).find((alug: any) => {
        if (!alug || !alug.id) return false;
        if (aluguerParaEditar && alug.id === aluguerParaEditar.id) return false;
        if (alug.status === 'Devolvido' || alug.status === 'Cancelado') return false; 
        
        // Verifica se o aluguel do banco contém este kit específico
        const temAqueleKit = alug.kits_alugados?.some((k: any) => k.id === meuKit.id) || alug.kit_id === meuKit.id;
        if (!temAqueleKit) return false;

        const inicioA = dateObjectRetirada; const fimA = dateObjectDevolucao;
        const inicioB = parseDataBR(alug.data_retirada); const fimB = parseDataBR(alug.data_devolucao);
        return (inicioA <= fimB && fimA >= inicioB);
      });

      if (conflito) {
        conflitoEncontrado = { pecaNome: meuKit.nome, ...conflito };
        break; // Para o loop assim que achar um conflito
      }
    }

    if (conflitoEncontrado) {
      Alert.alert("Peça Indisponível! ⚠️", `A peça "${conflitoEncontrado.pecaNome}" já está reservada para "${conflitoEncontrado.cliente_nome}" no período de ${conflitoEncontrado.data_retirada} até ${conflitoEncontrado.data_devolucao}. Remova esta peça da lista ou mude as datas.`);
      return; 
    }

    const c = clientes.find(item => item && item.id === clienteId);
    const numAluguel = Number(valorAluguel.replace(/\./g, '').replace(',', '.'));

    // Junta os nomes para exibição nos cartões antigos
    const nomesJuntos = kitsSelecionados.map(k => k.nome).join(', ');

    const dadosParaSalvar: any = {
      cliente_id: clienteId,
      cliente_nome: c?.responsavel_nome || aluguerParaEditar?.cliente_nome || "Sem nome",
      cliente_telefone: c?.responsavel_whatsapp || aluguerParaEditar?.cliente_telefone || "", 
      
      kits_alugados: kitsSelecionados, // 👈 ARRAY COM TODAS AS PEÇAS
      kit_id: kitsSelecionados[0]?.id || '', // Backward compatibility (salva o 1º)
      kit_nome: nomesJuntos, // Backward compatibility (salva todos os nomes juntos)
      
      data_retirada: dataRetirada,
      data_devolucao: dataDevolucao,
      status: aluguerParaEditar?.status || 'Pendente',
      valor_aluguel: numAluguel || 0,
      valor_pago: numAluguel || 0,
      forma_pagamento: formaPagamento,
      valor_multa: aluguerParaEditar?.valor_multa || 0,
      status_multa: aluguerParaEditar?.status_multa || 'Sem Multa',
      medidas_costureira: medidasCostureira 
    };

    if (aluguerParaEditar && aluguerParaEditar.id) {
      dadosParaSalvar.id = aluguerParaEditar.id;
    }

    onSave(dadosParaSalvar);
    limparFormulario();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{aluguerParaEditar ? '✏️ Editar Aluguel' : '✨ Novo Aluguel'}</Text>
                <TouchableOpacity onPress={() => { onClose(); limparFormulario(); }} style={{ padding: 4 }}>
                  <Feather name="x" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.sectionTitle}>1. Buscar Cliente *</Text>
              <View style={{ zIndex: 10 }}>
                <View style={styles.searchContainer}>
                  <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Digite o nome do cliente..."
                    value={buscaCliente}
                    onChangeText={(texto) => {
                      setBuscaCliente(texto);
                      setClienteId('');
                      setMostrarListaClientes(true);
                    }}
                    onFocus={() => setMostrarListaClientes(true)}
                  />
                  {buscaCliente.length > 0 && (
                    <TouchableOpacity onPress={() => { setBuscaCliente(''); setClienteId(''); setMostrarListaClientes(false); }}>
                      <Feather name="x-circle" size={20} color="#9ca3af" style={{ padding: 10 }} />
                    </TouchableOpacity>
                  )}
                </View>

                {mostrarListaClientes && buscaCliente.length > 0 && (
                  <View style={styles.listaBuscaContainer}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.itemBusca}
                            onPress={() => {
                              setClienteId(c.id);
                              setBuscaCliente(c.responsavel_nome);
                              setMostrarListaClientes(false);
                              Keyboard.dismiss();
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

              <Text style={styles.sectionTitle}>2. Adicionar Peças ({kitsSelecionados.length}) *</Text>
              
              <View style={styles.pickerContainer}>
                <Picker selectedValue={filtroSecao} onValueChange={setFiltroSecao} style={styles.picker}>
                  <Picker.Item label="Filtrar por Coleção..." value="" />
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

              {/* 👇 ÁREA DE SELEÇÃO E BOTÃO DE ADICIONAR */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={[styles.pickerContainer, { flex: 1, marginBottom: 0, borderColor: '#ea580c', borderWidth: 1.5 }]}>
                  <Picker selectedValue={kitIdPicker} onValueChange={setKitIdPicker} style={styles.picker}>
                    <Picker.Item label={`Escolher Peça (${kitsFiltrados.length})...`} value="" />
                    {kitsFiltrados.map(k => (
                      <Picker.Item 
                        key={k.id} 
                        label={`${k.id_etiqueta ? '['+k.id_etiqueta+'] ' : ''}${k.personagem || k.descricao || 'Sem descrição'}`} 
                        value={k.id} 
                      />
                    ))}
                  </Picker>
                </View>
                <TouchableOpacity 
                  style={[styles.btnAdicionarKit, !kitIdPicker && { opacity: 0.5 }]} 
                  onPress={handleAdicionarKit}
                  disabled={!kitIdPicker}
                >
                  <Feather name="plus" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* 👇 LISTA VISUAL DAS PEÇAS SELECIONADAS */}
              {kitsSelecionados.length > 0 && (
                <View style={styles.listaSelecionados}>
                  {kitsSelecionados.map((k, index) => (
                    <View key={k.id || index} style={styles.itemSelecionado}>
                      <View style={styles.itemSelecionadoIcon}>
                        <Feather name="check" size={14} color="#16a34a" />
                      </View>
                      <Text style={styles.itemSelecionadoTexto} numberOfLines={2}>{k.nome}</Text>
                      <TouchableOpacity onPress={() => handleRemoverKit(k.id)} style={{ padding: 4 }}>
                        <Feather name="trash-2" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>3. Datas *</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.datePickerButton, {flex: 1, marginRight: 8}]} onPress={() => setShowPickerRetirada(true)}>
                  <Text style={{ color: dataRetirada ? '#111827' : '#9ca3af', fontSize: 14 }}>{dataRetirada ? `Retirada: ${dataRetirada}` : "Selecionar Retirada"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.datePickerButton, {flex: 1, marginLeft: 8}]} onPress={() => setShowPickerDevolucao(true)}>
                  <Text style={{ color: dataDevolucao ? '#111827' : '#9ca3af', fontSize: 14 }}>{dataDevolucao ? `Devolução: ${dataDevolucao}` : "Selecionar Devolução"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>4. Medidas para Costureira</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', marginBottom: 16 }]} 
                placeholder="Ex: Fazer bainha 2cm, apertar cintura..." 
                multiline={true}
                value={medidasCostureira} 
                onChangeText={setMedidasCostureira} 
              />

              <Text style={styles.sectionTitle}>5. Valor (R$) e Pagamento *</Text>
              
              <TextInput 
                style={[styles.input, { marginBottom: 12 }]} 
                placeholder="Valor Total do Aluguel *" 
                keyboardType="numeric" 
                value={valorAluguel} 
                onChangeText={(t) => setValorAluguel(formatarMoeda(t))} 
              />

              <View style={styles.pickerContainer}>
                <Picker selectedValue={formaPagamento} onValueChange={setFormaPagamento} style={styles.picker}>
                  <Picker.Item label="Selecione a Forma de Pagamento..." value="" />
                  <Picker.Item label="Pix" value="Pix" />
                  <Picker.Item label="Dinheiro" value="Dinheiro" />
                  <Picker.Item label="Cartão" value="Cartão" />
                </Picker>
              </View>

              <TouchableOpacity style={styles.btnSalvar} onPress={confirmar}>
                <Text style={styles.btnSalvarText}>{aluguerParaEditar ? 'Atualizar Aluguel' : 'Salvar Aluguel'}</Text>
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#ea580c', marginTop: 10, marginBottom: 8, textTransform: 'uppercase' },
  pickerContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 12 },
  picker: { height: 50, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  datePickerButton: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 14, backgroundColor: '#f9fafb', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 12, fontSize: 16 },
  btnSalvar: { backgroundColor: '#ea580c', padding: 16, alignItems: 'center', borderRadius: 12, marginTop: 16 },
  btnSalvarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 8 },
  searchIcon: { paddingLeft: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: '#111827' },
  listaBuscaContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, maxHeight: 150, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  itemBusca: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemBuscaTexto: { fontSize: 16, color: '#111827' },
  
  // 👇 ESTILOS DA NOVA LISTA DE PEÇAS
  btnAdicionarKit: { backgroundColor: '#ea580c', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listaSelecionados: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  itemSelecionado: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fdba74' },
  itemSelecionadoIcon: { backgroundColor: '#dcfce7', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  itemSelecionadoTexto: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' }
});