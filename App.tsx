// App.tsx — Point d'entrée de Fieldz
// C'est le chef d'orchestre qui gère quelle page afficher

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { Colors } from './src/constants/colors';
import { useAuth } from './src/hooks/useAuth';
import { Spot } from './src/types';

// Écrans
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeMapScreen } from './src/screens/HomeMapScreen';
import { MapScreen } from './src/screens/MapScreen';
import { AddSpotScreen } from './src/screens/AddSpotScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Écrans sport (détail)
import FootballScreen from './src/sports/football/FootballScreen';
import BasketScreen from './src/sports/basket/BasketScreen';
import TennisScreen from './src/sports/tennis/TennisScreen';
import PetanqueScreen from './src/sports/petanque/PetanqueScreen';
import SkateScreen from './src/sports/skate/SkateScreen';
import BadmintonScreen from './src/sports/badminton/BadmintonScreen';
import VolleyScreen from './src/sports/volley/VolleyScreen';
import PingpongScreen from './src/sports/pingpong/PingpongScreen';
import RunningScreen from './src/sports/running/RunningScreen';
import FitnessScreen from './src/sports/fitness/FitnessScreen';

// Map des écrans sport par ID
const SPORT_SCREENS: Record<string, React.ComponentType<any>> = {
  football: FootballScreen,
  basket: BasketScreen,
  tennis: TennisScreen,
  petanque: PetanqueScreen,
  skate: SkateScreen,
  badminton: BadmintonScreen,
  volley: VolleyScreen,
  pingpong: PingpongScreen,
  running: RunningScreen,
  fitness: FitnessScreen,
};

const Tab = createBottomTabNavigator();

// Thème sombre pour la navigation
const navigationTheme = {
  dark: true,
  colors: {
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.backgroundSecondary,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'DMSans_400Regular', fontWeight: 'normal' as const },
    medium: { fontFamily: 'DMSans_500Medium', fontWeight: 'normal' as const },
    bold: { fontFamily: 'DMSans_700Bold', fontWeight: 'normal' as const },
    heavy: { fontFamily: 'BarlowCondensed_700Bold', fontWeight: 'normal' as const },
  },
};

// Onglets principaux
const TabNavigator = () => {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [showSpotDetail, setShowSpotDetail] = useState(false);

  const handleSpotDetails = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    setShowSpotDetail(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowSpotDetail(false);
    setSelectedSpot(null);
  }, []);

  // Si on affiche le détail d'un spot, on montre l'écran du sport correspondant
  if (showSpotDetail && selectedSpot) {
    const SportDetailScreen = SPORT_SCREENS[selectedSpot.sport];
    if (SportDetailScreen) {
      return <SportDetailScreen spot={selectedSpot} onBack={handleBack} />;
    }
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderTopColor: Colors.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Carte"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🗺️</Text>
          ),
        }}
      >
        {() => <HomeMapScreen onSpotDetails={handleSpotDetails} />}
      </Tab.Screen>

      <Tab.Screen
        name="Liste"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📋</Text>
          ),
        }}
      >
        {() => <MapScreen onSpotDetails={handleSpotDetails} />}
      </Tab.Screen>

      <Tab.Screen
        name="Ajouter"
        component={AddSpotScreen}
        options={{
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Text style={{ fontSize: 24 }}>➕</Text>
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Initialise Sentry pour le crash reporting (DSN vide = désactivé en dev)
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

function App() {
  const { user, loading: authLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Détecte si l'utilisateur est hors ligne
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Vérifie si l'utilisateur a déjà vu l'onboarding
  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(value => {
      if (value === 'true') setOnboardingDone(true);
      setOnboardingLoaded(true);
    });
  }, []);

  const handleOnboardingComplete = () => {
    setOnboardingDone(true);
    AsyncStorage.setItem('onboarding_done', 'true');
  };

  // Charge les polices (Barlow Condensed pour les titres, DM Sans pour le texte)
  const [fontsLoaded] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Écran de chargement pendant que les polices et l'auth se chargent
  if (!fontsLoaded || authLoading || !onboardingLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {/* Bannière hors ligne */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Pas de connexion internet</Text>
          </View>
        )}
        <NavigationContainer theme={navigationTheme}>
          {!onboardingDone && !user ? (
            // Pas encore vu l'onboarding → on le montre
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          ) : !user ? (
            // Onboarding vu mais pas connecté → écran de connexion
            <AuthScreen />
          ) : (
            // Connecté → app principale avec les onglets
            <TabNavigator />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: Colors.error,
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
