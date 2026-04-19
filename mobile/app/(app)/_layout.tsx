import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#42dec3',
        tabBarInactiveTintColor: '#8b9db3',
        tabBarStyle: {
          backgroundColor: '#0a1f33',
          borderTopColor: '#0f2b45',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alunos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="gerar"
        options={{
          title: 'Gerar Treino',
          tabBarIcon: ({ color, size }) => (
            <Feather name="zap" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />

      {/* Hidden routes — accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="aluno/novo"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="aluno/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="plano/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
