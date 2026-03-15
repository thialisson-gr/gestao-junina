import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function KitCard({ kit, onPressOptions }: any) {
  // Se a peça for antiga, assume "Disponível"
  const statusAtual = kit.status_interno || 'Ativo';

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {kit.imagem_url ? (
          <Image source={{ uri: kit.imagem_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={24} color="#d1d5db" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.personagem}>{kit.personagem}</Text>
        <Text style={styles.idEtiqueta}>{kit.id_etiqueta}</Text>
        
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{kit.genero}</Text>
          </View>
          {kit.ano_tema ? (
            <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: '#4b5563' }]}>{kit.ano_tema}</Text>
            </View>
          ) : null}
        </View>

        {/* ALERTA VISUAL DE STATUS */}
        {statusAtual === 'Inativo' && (
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
            <Feather name="slash" size={12} color="#dc2626" style={{marginRight: 4}} />
            <Text style={[styles.statusText, { color: '#dc2626' }]}>Inativo</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.optionsButton} onPress={onPressOptions}>
        <Feather name="more-vertical" size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imageContainer: { width: 64, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f9fafb', marginRight: 16 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  personagem: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  idEtiqueta: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#ea580c', fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  optionsButton: { padding: 8 },
});