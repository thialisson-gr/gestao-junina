import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClienteCard({ cliente, onPressWhatsApp, onPressOptions }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        {/* Agora usa as palavras exatas da sua base de dados! */}
        <Text style={styles.nomeResponsavel}>{cliente.responsavel_nome}</Text>
        
        {cliente.aluno_nome ? (
          <Text style={styles.nomeAluno}>
            Aluno: {cliente.aluno_nome} {cliente.aluno_escola ? `(${cliente.aluno_escola})` : ''}
          </Text>
        ) : null}
        
        <Text style={styles.whatsapp}>{cliente.responsavel_whatsapp}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onPressWhatsApp}>
          <Feather name="message-circle" size={20} color="#10b981" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            console.log("Clique nos 3 pontinhos detectado!");
            if (onPressOptions) {
              onPressOptions();
            } else {
              console.log("A função onPressOptions não foi passada para o Card");
            }
          }}
        >
          <Feather name="more-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoContainer: { flex: 1 },
  nomeResponsavel: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  nomeAluno: { fontSize: 14, color: '#4b5563', marginBottom: 4 },
  whatsapp: { fontSize: 14, color: '#6b7280' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { padding: 8 },
});