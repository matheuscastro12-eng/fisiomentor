import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    // Validation
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else {
          setError(error.message || 'Erro ao fazer login');
        }
      } else {
        router.replace('/(app)');
      }
    } catch (err) {
      setError('Erro ao conectar. Tente novamente.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    // Placeholder for Google SSO implementation
    Alert.alert(
      'Em breve',
      'Login com Google será disponibilizado em breve'
    );
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="flex-1 px-lg py-3xl justify-between">
        {/* Header */}
        <View>
          <View className="items-center mb-3xl">
            <View className="bg-primary rounded-full w-16 h-16 justify-center items-center mb-lg">
              <Text className="text-on-primary text-2xl font-bold">FM</Text>
            </View>
            <Text className="text-3xl font-bold text-on-surface mt-lg">
              FisioMentor
            </Text>
            <Text className="text-on-surface-variant text-sm mt-sm">
              Plataforma de Prescrição de Treino
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-md mb-lg">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View className="mb-lg">
            <Text className="text-on-surface font-semibold mb-sm">Email</Text>
            <TextInput
              className="bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface"
              placeholder="seu@email.com"
              placeholderTextColor="#8b9db3"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-lg">
            <View className="flex-row justify-between items-center mb-sm">
              <Text className="text-on-surface font-semibold">Senha</Text>
              <Link href="/(auth)/recuperar">
                <Text className="text-primary text-sm font-semibold">
                  Esqueceu?
                </Text>
              </Link>
            </View>
            <View className="relative flex-row items-center">
              <TextInput
                className="flex-1 bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface pr-xl"
                placeholder="Sua senha"
                placeholderTextColor="#8b9db3"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                className="absolute right-lg"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#42dec3"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary rounded-lg py-md justify-center items-center mb-lg"
          >
            {isLoading ? (
              <ActivityIndicator color="#061423" size="small" />
            ) : (
              <Text className="text-on-primary font-bold text-lg">Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-lg">
            <View className="flex-1 h-px bg-surface-container-high" />
            <Text className="text-on-surface-variant text-sm mx-md">ou</Text>
            <View className="flex-1 h-px bg-surface-container-high" />
          </View>

          {/* Google SSO Button */}
          <TouchableOpacity
            onPress={handleGoogleSSO}
            disabled={isLoading}
            className="border border-primary rounded-lg py-md justify-center items-center mb-xl flex-row"
          >
            <Ionicons name="logo-google" size={20} color="#42dec3" />
            <Text className="text-primary font-semibold ml-md">
              Entrar com Google
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center">
            <Text className="text-on-surface-variant text-sm">
              Não tem conta?{' '}
            </Text>
            <Link href="/(auth)/cadastro">
              <Text className="text-primary font-bold">Cadastre-se</Text>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
