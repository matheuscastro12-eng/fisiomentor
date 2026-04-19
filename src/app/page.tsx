import Link from "next/link";
import {
  Sparkles,
  Shield,
  Brain,
  Activity,
  ArrowRight,
  Stethoscope,
  Users,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-outline-variant">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="font-display text-title-lg text-primary">
              Curador Clínico
            </span>
            <span className="font-body text-label-sm text-on-surface-variant ml-2 hidden sm:inline">
              by FisioMentor
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-5 py-2 rounded-xl bg-gradient-primary text-on-primary font-medium text-body-sm transition-all hover:shadow-ambient-md"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-label-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Prescrição de treino baseada em evidências
          </div>
          <h1 className="font-display text-display-lg text-on-surface mb-6 leading-tight">
            Treinos personalizados com{" "}
            <span className="text-gradient-primary">inteligência clínica</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            O Curador Clínico usa IA e diretrizes ACSM/OMS para gerar planos de
            treino seguros e individualizados para pacientes com condições
            clínicas especiais.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-primary text-on-primary font-medium text-body-md transition-all hover:shadow-ambient-lg hover:scale-[1.02]"
            >
              Começar Gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-surface-container text-on-surface font-medium text-body-md hover:bg-surface-container-high transition-all"
            >
              Ver Funcionalidades
            </a>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="funcionalidades" className="py-20 px-6 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-headline-lg text-on-surface text-center mb-4">
            Prescrição inteligente para cada paciente
          </h2>
          <p className="font-body text-body-lg text-on-surface-variant text-center max-w-2xl mx-auto mb-16">
            Cada plano é fundamentado em diretrizes clínicas internacionais e
            validado automaticamente contra contraindicações.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="IA com Base em Evidências"
              description="Motor de geração alimentado por Gemini com busca vetorial RAG sobre diretrizes ACSM, OMS e posicionamentos médicos."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Validação Clínica Automática"
              description="11+ regras de validação verificam contraindicações cardiovasculares, metabólicas, ortopédicas e interações medicamentosas."
            />
            <FeatureCard
              icon={<Stethoscope className="h-6 w-6" />}
              title="Badge System de Severidade"
              description="Sistema visual de alertas vermelho/amarelo/verde que sinaliza riscos e restrições específicas do paciente."
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6" />}
              title="Acompanhamento de Progresso"
              description="Registre sessões, monitore PSE (Borg), frequência semanal e evolução da composição corporal."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Multi-Paciente"
              description="Gerencie todos os seus pacientes com isolamento por RLS. Cada profissional vê apenas seus dados."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Exportação Profissional"
              description="Exporte planos formatados em PDF com alertas clínicos, programa semanal e cuidados de monitoramento."
            />
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-headline-lg text-on-surface text-center mb-16">
            Como funciona
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Cadastre o paciente",
                desc: "Dados pessoais, diagnósticos, medicamentos, cirurgias, PAR-Q e preferências de treino em um formulário guiado.",
              },
              {
                step: "02",
                title: "A IA gera o plano",
                desc: "O motor busca diretrizes relevantes via RAG, analisa o perfil clínico e gera um plano completo com séries, repetições e orientações de carga.",
              },
              {
                step: "03",
                title: "Validação automática",
                desc: "Regras clínicas verificam contraindicações, interações medicamentosas e geram alertas de monitoramento específicos.",
              },
              {
                step: "04",
                title: "Revise e aplique",
                desc: "Você revisa o plano, faz ajustes se necessário, exporta em PDF e acompanha o progresso do paciente.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-mono text-title-md text-primary">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-title-lg text-on-surface mb-1">
                    {item.title}
                  </h3>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 bg-surface-container-lowest">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-headline-lg text-on-surface mb-4">
            Comece a prescrever com confiança
          </h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-8">
            Junte-se aos profissionais de Educação Física que usam IA clínica
            para prescrever treinos mais seguros.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-primary text-on-primary font-medium text-body-md transition-all hover:shadow-ambient-lg hover:scale-[1.02]"
          >
            Criar Conta Gratuita
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-outline-variant">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-display text-title-sm text-primary">
              Curador Clínico
            </span>
            <span className="text-label-sm text-on-surface-variant ml-2">
              by FisioMentor
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant/50">
            Prescrição de exercício assistida por IA. O profissional é
            responsável pela revisão final.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-all group">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-title-md text-on-surface mb-2">
        {title}
      </h3>
      <p className="font-body text-body-sm text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
