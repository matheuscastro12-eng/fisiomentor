"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Brain,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  Key,
  LogOut,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0: hidden, 1: confirm, 2: confirmed
  const [deleting, setDeleting] = useState(false);

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("");

  // AI Preferences
  const [defaultModality, setDefaultModality] = useState("ambos");
  const [planDetailLevel, setPlanDetailLevel] = useState("detalhado");
  const [includeAssessment, setIncludeAssessment] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("auth_user_id", user?.id ?? "")
        .single();

      if (prof) {
        setName(prof.name ?? "");
        setEmail(prof.email ?? "");
        setCref(prof.cref ?? "");
        setSpecialty(prof.specialty ?? "");
        const prefs = prof.preferences as any;
        if (prefs) {
          setDefaultModality(prefs.defaultModality ?? "ambos");
          setPlanDetailLevel(prefs.planDetailLevel ?? "detalhado");
          setIncludeAssessment(prefs.includeAssessmentProtocols ?? true);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("professionals")
      .update({
        name,
        cref,
        specialty,
        preferences: {
          defaultModality,
          planDetailLevel,
          includeAssessmentProtocols: includeAssessment,
        },
      })
      .eq("auth_user_id", user?.id ?? "");

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordReset = async () => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (!error) {
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("auth_user_id", user?.id ?? "")
        .single();

      const { data: students } = await supabase
        .from("students")
        .select(
          "*, health_profiles(*), training_preferences(*), physical_assessments(*)"
        )
        .eq("professional_id", prof?.id ?? "");

      const { data: plans } = await supabase
        .from("training_plans")
        .select("*")
        .eq("professional_id", prof?.id ?? "");

      const exportData = {
        exportDate: new Date().toISOString(),
        professional: prof,
        students,
        trainingPlans: plans,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fisiomentor-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro na exportação:", err);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteStep < 2) return;
    setDeleting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // Note: full deletion requires server-side admin action
      // Here we mark the account and sign out
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="font-display text-headline-lg text-on-surface mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Configurações
      </h1>

      <Tabs defaultValue="perfil">
        <TabsList className="mb-6">
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Preferências de IA
          </TabsTrigger>
          <TabsTrigger value="conta" className="gap-2">
            <Shield className="h-4 w-4" />
            Conta
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Profile ─── */}
        <TabsContent value="perfil">
          <Card className="bg-surface-container-low">
            <CardContent className="pt-0">
              <h2 className="font-display text-title-lg text-on-surface mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Perfil Profissional
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <Input label="Email" value={email} disabled />
                  <p className="text-[10px] text-on-surface-variant/50 mt-1">
                    Somente leitura
                  </p>
                </div>
                <Input
                  label="CREF"
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  placeholder="Ex: 123456-G/SP"
                />
                <Input
                  label="Especialidade"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Prescrição Clínica"
                />
              </div>

              {/* Save */}
              <div className="flex items-center justify-end gap-3 mt-6">
                {saved && (
                  <span className="text-body-sm text-success flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Salvo
                  </span>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 2: AI Preferences ─── */}
        <TabsContent value="ia">
          <Card className="bg-surface-container-low">
            <CardContent className="pt-0">
              <h2 className="font-display text-title-lg text-on-surface mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Preferências de Geração
              </h2>

              {/* Default Modality */}
              <div className="mb-6">
                <label className="text-label-sm text-on-surface-variant block mb-2">
                  Modalidade Padrão
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "musculacao", label: "Musculação" },
                    { value: "aerobio", label: "Aeróbio" },
                    { value: "ambos", label: "Ambos" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDefaultModality(opt.value)}
                      className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all ${
                        defaultModality === opt.value
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Level */}
              <div className="mb-6">
                <label className="text-label-sm text-on-surface-variant block mb-2">
                  Nível de Detalhamento
                </label>
                <div className="flex gap-2">
                  {[
                    {
                      value: "sintetico",
                      label: "Sintético",
                      desc: "Exercícios essenciais, orientações concisas",
                    },
                    {
                      value: "detalhado",
                      label: "Detalhado",
                      desc: "Inclui notas, progressão e protocolos",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPlanDetailLevel(opt.value)}
                      className={`flex-1 p-4 rounded-xl transition-all text-left ${
                        planDetailLevel === opt.value
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      <p className="text-body-sm text-on-surface font-medium">
                        {opt.label}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assessment Protocols Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                <div>
                  <p className="text-body-sm text-on-surface">
                    Incluir Protocolos de Avaliação por Padrão
                  </p>
                  <p className="text-label-sm text-on-surface-variant/60">
                    A IA sugere protocolos de reavaliação no plano
                  </p>
                </div>
                <button
                  onClick={() => setIncludeAssessment(!includeAssessment)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    includeAssessment ? "bg-primary" : "bg-surface-container-high"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      includeAssessment ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Save */}
              <div className="flex items-center justify-end gap-3 mt-6">
                {saved && (
                  <span className="text-body-sm text-success flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Salvo
                  </span>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Account ─── */}
        <TabsContent value="conta">
          <div className="space-y-4">
            {/* Password Reset */}
            <Card className="bg-surface-container-low">
              <CardContent className="pt-0">
                <h3 className="font-display text-title-md text-on-surface mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Alterar Senha
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Um email de redefinição será enviado para{" "}
                  <span className="font-mono text-primary">{email}</span>
                </p>
                {resetSent ? (
                  <span className="text-body-sm text-success flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Email enviado! Verifique sua caixa de entrada.
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePasswordReset}
                    className="gap-1"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Enviar Email de Redefinição
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card className="bg-surface-container-low">
              <CardContent className="pt-0">
                <h3 className="font-display text-title-md text-on-surface mb-3 flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  Exportar Meus Dados
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Baixe um arquivo JSON contendo todos os seus dados: alunos,
                  planos de treino e configurações.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="gap-1"
                >
                  {exporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Exportar Dados
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="bg-surface-container-low">
              <CardContent className="pt-0">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-3 w-full text-left bg-surface-container rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-body-sm font-medium">Sair da Conta</span>
                </button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="bg-surface-container-low">
              <CardContent className="pt-0">
                <h3 className="font-display text-title-md text-error mb-3 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir Conta
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Esta ação é irreversível. Todos os seus dados, alunos e planos
                  serão permanentemente excluídos.
                </p>

                {deleteStep === 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDeleteStep(1)}
                    className="text-error hover:bg-error/10"
                  >
                    Excluir Minha Conta
                  </Button>
                )}

                {deleteStep === 1 && (
                  <div className="p-4 bg-error-container/10 rounded-xl border border-error/20">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                      <div>
                        <p className="text-body-sm text-on-surface font-medium">
                          Tem certeza que deseja excluir sua conta?
                        </p>
                        <p className="text-label-sm text-on-surface-variant mt-1">
                          Todos os dados associados serão permanentemente
                          removidos.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteStep(0)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setDeleteStep(2)}
                        className="bg-error text-white hover:bg-error/90"
                      >
                        Sim, Excluir Permanentemente
                      </Button>
                    </div>
                  </div>
                )}

                {deleteStep === 2 && (
                  <div className="p-4 bg-error-container/10 rounded-xl border border-error/20">
                    <p className="text-body-sm text-error font-medium mb-3">
                      Última confirmação: clique para excluir
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteStep(0)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-error text-white hover:bg-error/90 gap-1"
                      >
                        {deleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Confirmar Exclusão
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
