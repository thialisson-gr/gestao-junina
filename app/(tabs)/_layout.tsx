import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão
        tabBarShowLabel: true, // Mostra o texto debaixo do ícone
        tabBarActiveTintColor: '#ea580c', // Laranja do nosso tema quando selecionado
        tabBarInactiveTintColor: '#9ca3af', // Cinza quando inativo
        tabBarStyle: {
          position: 'absolute',
          bottom: 24, // Descola do fundo
          left: 20,   // <-- Afasta 20 píxeis da borda esquerda
          right: 20,  // <-- Afasta 20 píxeis da borda direita
          backgroundColor: '#ffffff',
          borderRadius: 24, // Bordas bem redondas
          height: 64,
          borderTopWidth: 0, // Remove a linha do topo
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 20,
          
          // Sombras para flutuar
          elevation: 10, 
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="acervo"
        options={{
          title: 'Acervo',
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
          name="financeiro"
          options={{
            title: 'Caixa',
            tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={24} color={color} />,
          }}
        />
    </Tabs>
  );
}