import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return {
    ...config,
    name: 'Fieldz',
    slug: 'Fieldz',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0F0F0F',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fieldz.app',
      usesAppleSignIn: true,
      newArchEnabled: true,
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
      config: {
        googleMapsApiKey: googleMapsKey,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Fieldz utilise ta position pour trouver les terrains de sport près de toi.',
        NSCameraUsageDescription:
          "Fieldz a besoin de l'appareil photo pour prendre des photos de spots.",
        NSPhotoLibraryUsageDescription:
          "Fieldz a besoin d'accéder à tes photos pour ajouter une image à un spot.",
      },
    },
    android: {
      newArchEnabled: true,
      adaptiveIcon: {
        backgroundColor: '#0F0F0F',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.fieldz.app',
      config: {
        googleMaps: {
          apiKey: googleMapsKey,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
      ],
    },
    extra: {
      eas: {
        projectId: '823447ad-ac68-4728-b518-1be69eb3ce60',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-location',
      'expo-image-picker',
      'expo-apple-authentication',
      ['@sentry/react-native/expo', {
        organization: process.env.SENTRY_ORG ?? '',
        project: process.env.SENTRY_PROJECT ?? '',
      }],
    ],
  };
};
