"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      { redirectTo: `${window.location.origin}/auth/callback` }
    );

    if (resetError) {
      setError("Erro ao enviar e-mail de recuperação. Tente novamente.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-container/20 mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="font-display text-headline-md text-on-surface mb-2">
          E-mail enviado
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mb-8">
          Verifique sua caixa de entrada e siga as instruções para redefinir sua
          senha.
        </p>
        <Link href="/login">
          <Button variant="secondary">Voltar ao login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/login"
        className="inline-flex items-center text-body-sm text-on-surface-variant hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao login
      </Link>

      <h2 className="font-display text-headline-md text-on-surface mb-2">
        Recuperar senha
      </h2>
      <p className="font-body text-body-md text-on-surface-variant mb-8">
        Enviaremos um link de recuperação para seu e-mail
      </p>

      {error && (
        <div className="bg-error-container/20 rounded-xl p-4 mb-6">
          <p className="text-body-sm text-error font-body">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail cadastrado</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
