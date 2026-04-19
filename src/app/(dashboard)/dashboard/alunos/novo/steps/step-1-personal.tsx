"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, type Step1Data } from "@/lib/validations/student";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StepProps {
  data: Partial<Step1Data>;
  onChange: (data: Partial<Step1Data>) => void;
  onValidChange: (valid: boolean) => void;
}

export function Step1Personal({ data, onChange, onValidChange }: StepProps) {
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: data.name ?? "",
      birthDate: data.birthDate ?? "",
      sex: data.sex ?? undefined,
      weightKg: data.weightKg ?? (undefined as any),
      heightCm: data.heightCm ?? (undefined as any),
    },
    mode: "all",
  });

  const values = form.watch();

  // Run validation on mount so that returning to an already-filled step
  // immediately enables the Next button.
  useEffect(() => {
    form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange(values);
    onValidChange(form.formState.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, form.formState.isValid]);

  return (
    <Form {...form}>
      <div className="space-y-5">
        <h3 className="font-display text-title-lg text-on-surface">
          Dados Pessoais
        </h3>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do aluno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo biológico</FormLabel>
                <FormControl>
                  <select
                    className="flex h-11 w-full rounded-xl bg-surface-container-highest px-4 py-2 font-body text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heightCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="175"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}
