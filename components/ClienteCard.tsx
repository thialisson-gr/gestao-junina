import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClienteCard({ cliente, onPressWhatsApp, onPressOptions }: any) {
  // 👇 Estado que controla se o cartão está encolhido (false) ou expandido (true)
  const [expandido, setExpandido] = useState(false);

  if (!cliente) return null;

  return (
    <View style={styles.card}>
      
      {/* LINHA PRINCIPAL DO CARTÃO */}
      <View style={styles.linhaPrincipal}>
        
        {/* Lado Esquerdo: Área clicável para expandir */}
        <TouchableOpacity 
          style={styles.infoContainer} 
          activeOpacity={0.6} 
          onPress={() => setExpandido(!expandido)}
        >
          <View style={styles.nomeHeader}>
            <Text style={styles.nomeResponsavel}>{cliente.responsavel_nome}</Text>
            {/* Ícone de setinha para mostrar que é clicável */}
            <Feather name={expandido ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
          </View>
          
          <Text style={styles.linhaInfo}>
            <Feather name="smile" size={14} color="#6b7280" /> Aluno: <Text style={styles.destaque}>{cliente.aluno_nome}</Text>
          </Text>
          
          <Text style={styles.linhaInfo}>
            <Feather name="phone" size={14} color="#6b7280" /> Tel: <Text style={styles.destaque}>{cliente.responsavel_whatsapp}</Text>
          </Text>
          
          <Text style={styles.linhaInfo}>
            <Feather name="book" size={14} color="#6b7280" /> Escola: <Text style={styles.destaque}>{cliente.aluno_escola}</Text>
          </Text>
        </TouchableOpacity>

        {/* Lado Direito: Os Botões de Ação mantêm-se inalterados */}
        <View style={styles.acoesContainer}>
          <TouchableOpacity style={styles.btnWhatsApp} onPress={onPressWhatsApp}>
            <Feather name="message-circle" size={20} color="#16a34a" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOpcoes} onPress={onPressOptions}>
            <Feather name="more-vertical" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

      </View>

      {/* 👇 ÁREA EXPANSÍVEL: Só aparece se 'expandido' for true */}
      {expandido && (
        <View style={styles.areaExpandida}>
          <View style={styles.enderecoHeader}>
            <Feather name="map-pin" size={14} color="#ea580c" />
            <Text style={styles.enderecoLabel}>Endereço Completo:</Text>
          </View>
          <Text style={styles.enderecoTexto}>
            {cliente.endereco || 'Nenhum endereço cadastrado.'}
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden' // Garante que o fundo cinza da expansão não sai das bordas arredondadas
  },
  linhaPrincipal: {
    flexDirection: 'row',
    padding: 16,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  nomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Empurra a setinha para a direita
    marginBottom: 6,
    paddingRight: 10, // Evita colar nos botões de ação
  },
  nomeResponsavel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  linhaInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  destaque: {
    color: '#374151',
    fontWeight: '500',
  },
  acoesContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  btnWhatsApp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOpcoes: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Estilos da nova área expansível
  areaExpandida: {
    backgroundColor: '#fff7ed', // Fundo laranjinha bem claro para destacar
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffedd5',
  },
  enderecoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  enderecoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  enderecoTexto: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  }
});