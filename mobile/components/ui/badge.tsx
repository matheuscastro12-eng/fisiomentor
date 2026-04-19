import React from 'react';
import { View, Text, type ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'red' | 'yellow' | 'green' | 'teal' | 'neutral';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: {
    container: 'bg-gray-200 dark:bg-on-surface-variant/20',
    text: 'text-gray-600 dark:text-on-surface-variant',
  },
  red: {
    container: 'bg-red-100 dark:bg-error/20',
    text: 'text-red-600 dark:text-error',
  },
  yellow: {
    container: 'bg-amber-100 dark:bg-warning/20',
    text: 'text-amber-700 dark:text-warning',
  },
  green: {
    container: 'bg-green-100 dark:bg-success/20',
    text: 'text-green-600 dark:text-success',
  },
  teal: {
    container: 'bg-teal-100 dark:bg-primary/20',
    text: 'text-teal-700 dark:text-primary',
  },
  neutral: {
    container: 'bg-gray-100 dark:bg-surface-container-high',
    text: 'text-gray-500 dark:text-on-surface-variant',
  },
};

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View
      className={`px-3 py-1 rounded-full flex-row items-center ${styles.container} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${styles.text}`}>
        {children}
      </Text>
    </View>
  );
}
