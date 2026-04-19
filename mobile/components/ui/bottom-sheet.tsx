import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View className="bg-white dark:bg-surface-container rounded-t-3xl px-6 pb-8 pt-4 max-h-[80%]">
                {/* Handle bar */}
                <View className="items-center mb-4">
                  <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-on-surface-variant/30" />
                </View>
                {title && (
                  <Text className="text-lg font-semibold text-gray-900 dark:text-on-surface mb-4">
                    {title}
                  </Text>
                )}
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
