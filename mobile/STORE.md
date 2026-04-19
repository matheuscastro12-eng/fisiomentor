# FisioMentor — Store Listing & ASO Metadata

## App Store (iOS) & Google Play (Android)

---

### Nome do App
**FisioMentor — Treino Clínico IA**

### Subtítulo (iOS) / Título Curto (Android)
Prescrição de treino segura com IA

---

### Descrição Curta (80 caracteres)
Planos de treino com IA para populações especiais. Segurança clínica garantida.

---

### Descrição Completa

O FisioMentor é a ferramenta definitiva para Profissionais de Educação Física que atendem populações especiais — pacientes com diabetes, hipertensão, cardiopatias, obesidade, DPOC, osteoporose e outras condições crônicas.

**Como funciona:**
• Cadastre seu aluno com o perfil clínico completo (condições, medicamentos, risco cardiovascular)
• A inteligência artificial gera planos de treino personalizados respeitando todas as restrições clínicas
• Os planos seguem diretrizes das sociedades médicas brasileiras (SBD, SBC, SBHIPERTENSÃO)
• Acompanhe a evolução com avaliações físicas e gráficos de progresso

**Diferenciais:**
• IA treinada com diretrizes clínicas brasileiras via RAG (Retrieval-Augmented Generation)
• Sistema de badges de risco: vermelho (alto risco), amarelo (moderado), verde (seguro)
• Contraindicações automáticas por condição e medicamento
• Protocolos de monitoramento incluídos nos planos
• Exportação em PDF profissional com cabeçalho do profissional e rodapé legal
• Histórico completo de avaliações com gráficos de evolução

**Para quem é o FisioMentor:**
• Educadores Físicos (CREF) que atendem em clínicas, academias ou domicílio
• Personal trainers especializados em populações especiais
• Profissionais de saúde que prescrevem exercício como tratamento complementar

**Segurança em primeiro lugar:**
Cada plano gerado respeita as contraindicações clínicas do paciente. A IA nunca prescreve exercícios incompatíveis com o perfil de saúde. Restrições absolutas e relativas são sinalizadas com clareza.

---

### Palavras-chave (iOS - 100 caracteres máx.)
treino,exercício,IA,prescrição,diabetes,hipertensão,saúde,personal,CREF,clínico,fitness,educação

### Tags/Categorias
- **Categoria primária:** Saúde e Fitness
- **Categoria secundária:** Medicina
- **Content Rating:** Everyone / 4+

---

### Screenshots (sugestão de telas para capturas)

1. **Dashboard** — Lista de alunos com badges de condição clínica
2. **Perfil do Aluno** — Detalhes clínicos com sistema de cores
3. **Geração com IA** — Tela de loading com mensagens rotativas
4. **Plano de Treino** — Divisão semanal com exercícios e intensidades
5. **Avaliação Física** — Gráficos de evolução temporal (peso, composição)
6. **Cadastro** — Formulário step-by-step com chips de condições
7. **PDF Export** — Preview do relatório profissional gerado
8. **Configurações** — Preferências de IA e perfil profissional

---

### URL de Privacidade
https://fisiomentor.com.br/privacidade

### URL de Termos de Uso
https://fisiomentor.com.br/termos

### URL de Suporte
https://fisiomentor.com.br/suporte

---

## ASO — Otimização para Busca

### Palavras-chave primárias (alto volume)
- prescrição de exercício
- treino personalizado
- personal trainer app
- educação física
- treino com IA

### Palavras-chave secundárias (nicho)
- treino diabetes
- exercício hipertensão
- treino populações especiais
- prescrição clínica exercício
- CREF profissional
- treino cardiopata
- exercício para obeso
- avaliação física app

### Palavras-chave long-tail
- app para personal trainer prescrever treino
- gerador de treino com inteligência artificial
- treino seguro para diabético
- exercício seguro para hipertenso
- app educação física populações especiais

---

## Builds & Deploy — Comandos Rápidos

```bash
# Development (simulador)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview (teste interno)
eas build --profile preview --platform all

# Production (lojas)
eas build --profile production --platform all

# Submit para lojas
eas submit --platform ios --profile production
eas submit --platform android --profile production

# OTA Update (sem rebuild)
eas update --branch production --message "fix: correção de bug X"
```

---

## Checklist Pré-Publicação

- [ ] Gerar ícone 1024×1024 (fundo #061423, símbolo teal #42dec3)
- [ ] Gerar splash screen 1284×2778
- [ ] Gerar adaptive icon (Android) foreground + background
- [ ] Gerar notification icon (monocromático, branco)
- [ ] Criar conta Apple Developer ($99/ano)
- [ ] Criar conta Google Play Developer ($25 único)
- [ ] Configurar EAS_PROJECT_ID em eas.json
- [ ] Configurar variáveis de ambiente no EAS Secrets
- [ ] Preencher App Store Connect metadata
- [ ] Preencher Google Play Console listing
- [ ] Screenshots para iPhone 6.7" e 5.5"
- [ ] Screenshots para Android phone e tablet
- [ ] Testar deep links (fisiomentor://)
- [ ] Testar notificações push em device real
- [ ] Testar compartilhamento de PDF
- [ ] Revisar permissões (câmera, galeria, notificações)
- [ ] Configurar google-services-key.json para Android submit
- [ ] Configurar ASC credentials para iOS submit
