import React from 'react';
import { View, Text } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  className = '',
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const deltaColor = delta !== undefined
    ? isPositive
      ? 'text-green-500 dark:text-success'
      : 'text-red-500 dark:text-error'
    : '';

  return (
    <View
      className={`bg-white dark:bg-surface-container rounded-xl p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-medium text-gray-500 dark:text-on-surface-variant uppercase tracking-wide">
          {label}
        </Text>
        {icon && <View>{icon}</View>}
      </View>
      <View className="flex-row items-baseline">
        <Text className="text-3xl font-bold text-gray-900 dark:text-on-surface">
          {value}
        </Text>
        {unit && (
          <Text className="text-sm text-gray-500 dark:text-on-surface-variant ml-1">
            {unit}
          </Text>
        )}
      </View>
      {delta !== undefined && (
        <View className="flex-row items-center mt-1.5">
          <Text className={`text-xs font-medium ${deltaColor}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
            {deltaLabel ? ` ${deltaLabel}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
