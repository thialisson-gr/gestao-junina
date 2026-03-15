import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function KitCard({ kit, onPressOptions }: any) {
  if (!kit) return null;

  // Função para dar a cor certa ao status da peça
  const getStatusColor = () => {
    if (kit.status_interno === 'Inativo') return { bg: '#fee2e2', text: '#dc2626' }; // Vermelho
    if (kit.status_interno === 'Alugado') return { bg: '#fef3c7', text: '#d97706' }; // Laranja/Amarelo
    return { bg: '#dcfce7', text: '#16a34a' }; // Verde (Ativo/Disponível)
  };

  const statusColors = getStatusColor();

  return (
    <View style={styles.card}>
      
      {/* LADO ESQUERDO: FOTO DA PEÇA */}
      <View style={styles.imageContainer}>
        {kit.imagem_url ? (
          <Image source={{ uri: kit.imagem_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="box" size={24} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* CENTRO: INFORMAÇÕES DA PEÇA */}
      <View style={styles.infoContainer}>
        
        {/* Linha 1: Etiqueta e Status */}
        <View style={styles.headerRow}>
          <Text style={styles.etiqueta}>#{kit.id_etiqueta}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {kit.status_interno || 'Disponível'}
            </Text>
          </View>
        </View>

        {/* Linha 2: Nome da Peça */}
        <Text style={styles.personagem} numberOfLines={1}>{kit.personagem}</Text>
        
        {/* Linha 3: Coleção (Só aparece se tiver preenchido) */}
        {kit.ano_tema ? (
          <Text style={styles.tema} numberOfLines={1}>
            <Feather name="bookmark" size={12} /> Coleção: {kit.ano_tema}
          </Text>
        ) : null}

        {/* Linha 4: Gênero e Categoria */}
        <Text style={styles.detalhes}>
          {kit.genero} • {kit.categoria || 'Roupa'}
        </Text>
      </View>

      {/* LADO DIREITO: BOTÃO DE OPÇÕES (Editar/Excluir) */}
      <TouchableOpacity style={styles.btnOpcoes} onPress={onPressOptions}>
        <Feather name="more-vertical" size={20} color="#4b5563" />
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  imageContainer: {
    width: 80, // Um pouco maior para ver bem os detalhes da roupa
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2, // Espaçamento suave entre as linhas
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  personagem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  tema: {
    fontSize: 13,
    color: '#6b7280',
  },
  detalhes: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 2,
  },
  btnOpcoes: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  }
});