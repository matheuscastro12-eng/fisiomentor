import React from 'react';
import { Badge } from './badge';

const conditionSeverityMap: Record<string, 'red' | 'yellow' | 'default'> = {
  'Cardiopatia': 'red',
  'Insuficiência Cardíaca': 'red',
  'DPOC': 'red',
  'AVC': 'red',
  'Hérnia': 'red',
  'Diabetes T1': 'yellow',
  'Diabetes T2': 'yellow',
  'Diabetes Tipo II': 'yellow',
  'Hipertensão': 'yellow',
  'Obesidade': 'yellow',
  'Osteoporose': 'default',
  'Artrose': 'default',
  'Pós-cirúrgico': 'default',
  'Câncer em remissão': 'default',
  'Doença renal crônica': 'yellow',
};

interface ConditionBadgeProps {
  condition: string;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const variant = conditionSeverityMap[condition] || 'default';
  const icon = variant === 'red' ? '⚠ ' : variant === 'yellow' ? '● ' : '';
  return (
    <Badge variant={variant} className={className}>
      {icon}{condition}
    </Badge>
  );
}
