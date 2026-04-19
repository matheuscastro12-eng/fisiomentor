import '../global.css';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize any global setup here
    setIsReady(true);
  }, []);

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-surface">
        <StatusBar barStyle="light-content" backgroundColor="#061423" />
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
