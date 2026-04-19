import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label-md font-body text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-xl bg-surface-container-highest px-4 py-2",
            "font-body text-body-md text-on-surface",
            "placeholder:text-on-surface-variant/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            error && "ring-2 ring-error/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-body-sm text-error font-body">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
