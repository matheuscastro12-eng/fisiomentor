import React, { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  containerClassName = '',
  className = '',
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-on-surface mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`h-12 px-4 rounded-xl bg-gray-100 dark:bg-surface-container text-base text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-on-surface-variant/50 ${
          focused ? 'border-2 border-primary' : 'border border-transparent'
        } ${error ? 'border-2 border-error' : ''} ${className}`}
        placeholderTextColor={undefined}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500 dark:text-error mt-1">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text className="text-xs text-gray-400 dark:text-on-surface-variant/60 mt-1">
          {hint}
        </Text>
      )}
    </View>
  );
}
