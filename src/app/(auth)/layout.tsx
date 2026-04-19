export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-container/5" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <h1 className="font-display text-display-sm text-primary mb-2">
              Curador Clínico
            </h1>
            <p className="font-body text-title-md text-on-surface-variant uppercase tracking-wider">
              Gestão de Performance
            </p>
          </div>
          <p className="font-body text-body-lg text-on-surface-variant max-w-md leading-relaxed">
            Prescrição de treino inteligente para populações especiais.
            Baseado nas diretrizes do ACSM, OMS e sociedades médicas brasileiras.
          </p>
          <div className="mt-12 flex gap-8">
            <div>
              <p className="font-display text-display-md text-primary">IA</p>
              <p className="font-body text-body-sm text-on-surface-variant">
                Geração assistida
              </p>
            </div>
            <div>
              <p className="font-display text-display-md text-on-surface">RAG</p>
              <p className="font-body text-body-sm text-on-surface-variant">
                Diretrizes indexadas
              </p>
            </div>
            <div>
              <p className="font-display text-display-md text-warning">CLN</p>
              <p className="font-body text-body-sm text-on-surface-variant">
                Validação clínica
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
