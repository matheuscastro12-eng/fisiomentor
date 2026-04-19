import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.fisiomentor.app.dev';
  if (IS_PREVIEW) return 'com.fisiomentor.app.preview';
  return 'com.fisiomentor.app';
};

const getAppName = () => {
  if (IS_DEV) return 'FisioMentor (Dev)';
  if (IS_PREVIEW) return 'FisioMentor (Preview)';
  return 'FisioMentor';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'fisiomentor',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'fisiomentor',
  userInterfaceStyle: 'automatic',

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#061423',
  },

  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: getUniqueIdentifier(),
    supportsTablet: true,
    userInterfaceStyle: 'automatic',
    infoPlist: {
      NSCameraUsageDescription:
        'FisioMentor precisa da câmera para registrar fotos de avaliações físicas.',
      NSPhotoLibraryUsageDescription:
        'FisioMentor precisa acessar a galeria para anexar fotos às avaliações.',
      NSPhotoLibraryAddUsageDescription:
        'FisioMentor precisa salvar fotos de relatórios na galeria.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    package: getUniqueIdentifier(),
    userInterfaceStyle: 'automatic',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#061423',
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'SCHEDULE_EXACT_ALARM',
    ],
  },

  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },

  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#42dec3',
        sounds: [],
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'O app acessa suas fotos para anexar às avaliações físicas.',
        cameraPermission:
          'O app acessa sua câmera para registrar avaliações físicas.',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
    API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },

  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? ''}`,
  },

  runtimeVersion: {
    policy: 'appVersion',
  },

  owner: 'fisiomentor',
});
