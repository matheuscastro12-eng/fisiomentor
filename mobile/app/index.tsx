import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error checking auth:', error);
          router.replace('/(auth)/login');
          return;
        }

        if (data?.session) {
          router.replace('/(app)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.replace('/(auth)/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <View className="flex-1 bg-surface justify-center items-center">
      <ActivityIndicator size="large" color="#42dec3" />
    </View>
  );
}
