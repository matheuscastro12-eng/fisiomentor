import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-surface-container rounded-xl p-4 shadow-sm dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`pb-3 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`pt-3 flex-row items-center ${className}`} {...props}>
      {children}
    </View>
  );
}
