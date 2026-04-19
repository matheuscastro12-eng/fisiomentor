# FisioMentor Mobile - Expo Router Setup

## Overview
Complete Expo Router file-based routing configuration for FisioMentor clinical training prescription app with NativeWind styling, dark navy theme (#061423), and teal primary color (#42dec3).

## Files Created

### Root Layout
- **app/_layout.tsx** - Root layout with SafeAreaProvider, StatusBar, and global CSS import

### Entry Point
- **app/index.tsx** - Auth state check and routing redirect to login or app

### Auth Routes (app/(auth)/)
- **app/(auth)/_layout.tsx** - Auth Stack layout with no header
- **app/(auth)/login.tsx** - Login screen with email/password, Google SSO placeholder, links to registration and password recovery
- **app/(auth)/cadastro.tsx** - Registration screen with name, email, CREF, and password fields

### App Routes (app/(app)/)
- **app/(app)/_layout.tsx** - Bottom tab navigator with 4 tabs (Alunos, Gerar Treino, Relatórios, Configurações)
- **app/(app)/index.tsx** - Dashboard/Alunos tab with student list, search bar, and FAB for new student
- **app/(app)/gerar.tsx** - Gerar Treino tab with student selector and workout generation options
- **app/(app)/relatorios.tsx** - Reports tab with placeholder report cards and statistics
- **app/(app)/configuracoes.tsx** - Settings tab with user profile, preferences, support links, and logout

## Theme
- Background: #061423 (dark navy)
- Primary: #42dec3 (teal)
- Text: #e8eef4 (light)
- Secondary Text: #8b9db3 (slate)
- Surfaces: #0a1f33 (container), #0f2b45 (container-high)
- Status: #66bb6a (success), #ff6b6b (error), #ffa726 (warning)

## Styling
- **NativeWind** for Tailwind CSS in React Native
- **Custom Tailwind config** in tailwind.config.js with theme colors
- **Global CSS** imported in root layout (global.css)
- All screens use dark theme with proper color contrast

## Key Features
- Expo Router file-based routing with auth groups
- Safe area handling with SafeAreaProvider
- Supabase authentication integration
- Bottom tab navigation with icons
- Responsive layouts using NativeWind
- Portuguese language labels throughout
- Error handling with user-friendly messages
- Loading states with ActivityIndicator
- Placeholder data for development

## Icons
- **Ionicons** from @expo/vector-icons for system icons
- **Feather** from @expo/vector-icons for interface icons

## Integration Points
- Supabase client: `../../lib/supabase`
- Global styling: `../global.css`
- Vector icons: `@expo/vector-icons`
