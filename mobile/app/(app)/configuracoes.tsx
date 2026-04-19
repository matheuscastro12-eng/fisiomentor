import { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja fazer logout?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sair',
          onPress: async () => {
            setIsLoading(true);
            try {
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Erro', 'Erro ao fazer logout');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    action?: React.ReactNode
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className="flex-row items-center justify-between bg-surface-container rounded-lg p-lg mb-sm border border-surface-container-high"
    >
      <View className="flex-row items-center flex-1">
        <View className="bg-primary/20 rounded-lg w-12 h-12 justify-center items-center mr-lg">
          <Feather name={icon as any} size={20} color="#42dec3" />
        </View>
        <View className="flex-1">
          <Text className="text-on-surface font-semibold">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-on-surface-variant text-xs mt-xs">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {action}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-lg py-md">
        {/* Header */}
        <View className="mb-xl">
          <Text className="text-2xl font-bold text-on-surface">
            Configurações
          </Text>
        </View>

        {/* User Profile Section */}
        {user && (
          <View className="bg-surface-container rounded-lg p-lg mb-xl border border-surface-container-high">
            <View className="flex-row items-center gap-lg">
              <View className="bg-primary rounded-full w-16 h-16 justify-center items-center">
                <Ionicons
                  name="person"
                  size={28}
                  color="#061423"
                />
              </View>
              <View className="flex-1">
                <Text className="text-on-surface font-bold text-lg">
                  {user.user_metadata?.full_name || 'Usuário'}
                </Text>
                <Text className="text-on-surface-variant text-sm mt-xs">
                  {user.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* App Settings Section */}
        <Text className="text-on-surface font-bold text-lg mb-lg">
          App
        </Text>

        {renderSettingItem(
          'bell',
          'Notificações',
          'Receba atualizações do seu progresso',
          undefined,
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#0f2b45', true: '#42dec3' }}
            thumbColor={notificationsEnabled ? '#061423' : '#8b9db3'}
          />
        )}

        {renderSettingItem(
          'eye',
          'Tema',
          'Modo escuro (padrão)',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {renderSettingItem(
          'globe',
          'Idioma',
          'Português (BR)',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {/* Account Settings Section */}
        <Text className="text-on-surface font-bold text-lg mb-lg mt-xl">
          Conta
        </Text>

        {renderSettingItem(
          'lock',
          'Alterar Senha',
          'Atualize sua senha de segurança',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {renderSettingItem(
          'info',
          'Dados Pessoais',
          'Edite seus dados cadastrais',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {/* Help & Support Section */}
        <Text className="text-on-surface font-bold text-lg mb-lg mt-xl">
          Suporte
        </Text>

        {renderSettingItem(
          'help-circle',
          'Central de Ajuda',
          'Dúvidas frequentes e tutoriais',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {renderSettingItem(
          'mail',
          'Enviar Feedback',
          'Sugestões e relatos de problemas',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {renderSettingItem(
          'file-text',
          'Termos e Privacidade',
          'Leia nossos termos de serviço',
          undefined,
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8b9db3"
          />
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoading}
          className="bg-error/10 border border-error rounded-lg py-md justify-center items-center mt-xl mb-xl"
        >
          <Text className="text-error font-bold text-lg">
            {isLoading ? 'Saindo...' : 'Sair da Conta'}
          </Text>
        </TouchableOpacity>

        {/* Version Info */}
        <View className="items-center py-lg">
          <Text className="text-on-surface-variant text-xs">
            FisioMentor v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
