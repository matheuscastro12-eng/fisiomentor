import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-3 py-1 rounded-full font-body text-label-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary-container/80 text-secondary",
        red: "bg-error-container/80 text-error",
        yellow: "bg-warning-container/80 text-warning",
        green: "bg-success-container/80 text-success",
        teal: "bg-primary-container/20 text-primary",
        neutral: "bg-surface-container-high text-on-surface-variant",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

/**
 * Badge de condição clínica com cor por severidade
 */
const conditionSeverityMap: Record<string, "red" | "yellow" | "default"> = {
  "Cardiopatia": "red",
  "Insuficiência Cardíaca": "red",
  "DPOC": "red",
  "AVC": "red",
  "Hérnia": "red",
  "Diabetes T1": "yellow",
  "Diabetes T2": "yellow",
  "Diabetes Tipo II": "yellow",
  "Hipertensão": "yellow",
  "Obesidade": "yellow",
  "Osteoporose": "default",
  "Artrose": "default",
  "Pós-cirúrgico": "default",
  "Câncer em remissão": "default",
  "Doença renal crônica": "yellow",
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: string;
  className?: string;
}) {
  const variant = conditionSeverityMap[condition] || "default";
  return (
    <Badge variant={variant} className={className}>
      {variant === "red" && <span className="mr-1">&#9888;</span>}
      {variant === "yellow" && <span className="mr-1">&#9679;</span>}
      {condition}
    </Badge>
  );
}
