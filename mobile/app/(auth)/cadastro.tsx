import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CadastroScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cref, setCref] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');

    // Validation
    if (!name || !email || !cref || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up user with Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            cref: cref,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está registrado');
        } else {
          setError(signUpError.message || 'Erro ao criar conta');
        }
      } else {
        // Successfully signed up
        router.replace('/(auth)/login');
      }
    } catch (err) {
      setError('Erro ao conectar. Tente novamente.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="flex-1 px-lg py-2xl justify-between">
        {/* Header */}
        <View>
          <View className="mb-2xl">
            <TouchableOpacity className="mb-lg">
              <Ionicons
                name="chevron-back"
                size={28}
                color="#42dec3"
              />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-on-surface">
              Criar Conta
            </Text>
            <Text className="text-on-surface-variant text-sm mt-sm">
              Preencha seus dados para cadastro
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-md mb-lg">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Name Input */}
          <View className="mb-lg">
            <Text className="text-on-surface font-semibold mb-sm">
              Nome Completo
            </Text>
            <TextInput
              className="bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface"
              placeholder="Seu nome completo"
              placeholderTextColor="#8b9db3"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

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

          {/* CREF Input */}
          <View className="mb-lg">
            <Text className="text-on-surface font-semibold mb-sm">
              CREF/CRN
            </Text>
            <TextInput
              className="bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface"
              placeholder="Ex: 123456/RJ"
              placeholderTextColor="#8b9db3"
              value={cref}
              onChangeText={setCref}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-lg">
            <Text className="text-on-surface font-semibold mb-sm">Senha</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="flex-1 bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface pr-xl"
                placeholder="Crie uma senha segura"
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

          {/* Confirm Password Input */}
          <View className="mb-xl">
            <Text className="text-on-surface font-semibold mb-sm">
              Confirme a Senha
            </Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="flex-1 bg-surface-container border border-surface-container-high rounded-lg px-lg py-md text-on-surface pr-xl"
                placeholder="Confirme sua senha"
                placeholderTextColor="#8b9db3"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                className="absolute right-lg"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#42dec3"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={isLoading}
            className="bg-primary rounded-lg py-md justify-center items-center mb-lg"
          >
            {isLoading ? (
              <ActivityIndicator color="#061423" size="small" />
            ) : (
              <Text className="text-on-primary font-bold text-lg">
                Criar Conta
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View className="flex-row justify-center">
            <Text className="text-on-surface-variant text-sm">
              Já tem conta?{' '}
            </Text>
            <Link href="/(auth)/login">
              <Text className="text-primary font-bold">Faça login</Text>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
