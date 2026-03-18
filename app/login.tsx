import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { auth } from '../firebaseConfig';
import { useAuth } from './_layout';

export default function LoginScreen() {
  const { user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  // Se já tem conta, vai para as tabs!
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Campos Vazios", "Por favor, preencha o seu e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (error: any) {
      Alert.alert("Acesso Negado 🛑", "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Feather name="lock" size={40} color="#ea580c" />
        </View>
        <Text style={styles.brandName}>Nação Nordestina</Text>
        <Text style={styles.subTitle}>Gestão de Acervo e Alugueres</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.boasVindas}>Bem-vindo de volta! 👋</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail de Acesso</Text>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Digite o seu e-mail" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrapper}>
            <Feather name="key" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Digite a sua senha" placeholderTextColor="#9ca3af" value={senha} onChangeText={setSenha} secureTextEntry={!mostrarSenha} />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.eyeIcon}>
              <Feather name={mostrarSenha ? "eye" : "eye-off"} size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Entrar no Sistema</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  brandName: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#ea580c', marginTop: 4 },
  formContainer: { backgroundColor: '#fff', marginHorizontal: 24, padding: 24, borderRadius: 24, elevation: 8, shadowOpacity: 0.05 },
  boasVindas: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#4b5563', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 52 },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, height: '100%', color: '#111827', fontSize: 16 },
  eyeIcon: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  loginButton: { backgroundColor: '#ea580c', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});