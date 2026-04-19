import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  messages?: string[];
}

export function LoadingOverlay({
  visible,
  message = 'Carregando...',
  messages,
}: LoadingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentMsgIndex, setCurrentMsgIndex] = React.useState(0);

  useEffect(() => {
    if (!visible || !messages || messages.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentMsgIndex((prev) => (prev + 1) % messages.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, [visible, messages]);

  if (!visible) return null;

  const displayMessage = messages ? messages[currentMsgIndex] : message;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-8">
        <View className="bg-white dark:bg-surface-container rounded-2xl p-8 items-center w-full max-w-xs shadow-lg">
          <ActivityIndicator size="large" color="#42dec3" className="mb-4" />
          {messages ? (
            <Animated.Text
              style={{ opacity: fadeAnim }}
              className="text-base text-center text-gray-700 dark:text-on-surface-variant"
            >
              {displayMessage}
            </Animated.Text>
          ) : (
            <Text className="text-base text-center text-gray-700 dark:text-on-surface-variant">
              {displayMessage}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
