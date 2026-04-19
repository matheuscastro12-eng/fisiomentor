import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary',
    text: 'text-on-primary font-semibold',
  },
  secondary: {
    container: 'bg-gray-200 dark:bg-surface-container-high',
    text: 'text-gray-800 dark:text-on-surface font-semibold',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-gray-600 dark:text-on-surface-variant',
  },
  outline: {
    container: 'bg-transparent border border-gray-300 dark:border-on-surface-variant/30',
    text: 'text-gray-700 dark:text-on-surface-variant',
  },
  destructive: {
    container: 'bg-red-100 dark:bg-error/20',
    text: 'text-red-600 dark:text-error font-semibold',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'h-9 px-4 rounded-full', text: 'text-sm' },
  default: { container: 'h-11 px-6 rounded-full', text: 'text-base' },
  lg: { container: 'h-12 px-8 rounded-full', text: 'text-lg' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className = '',
  textClassName = '',
  ...props
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center ${sStyle.container} ${vStyle.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#061423' : '#42dec3'}
          className="mr-2"
        />
      ) : null}
      {typeof children === 'string' ? (
        <Text className={`${sStyle.text} ${vStyle.text} ${textClassName}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
