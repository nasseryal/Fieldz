// Écran Carte — home page avec carte plein écran
// En mode Expo Go : placeholder avec message
// En mode build EAS : vraie carte Google Maps avec marqueurs colorés
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { getSportById } from '../constants/sports';
import { ALL_SPORTS } from '../constants/sports';
import { Spot } from '../types';
import { FieldzLogo } from '../components/FieldzLogo';
import { useLocation } from '../hooks/useLocation';
import { useSpots } from '../hooks/useSpots';

interface HomeMapScreenProps {
  onSpotDetails: (spot: Spot) => void;
}

export const HomeMapScreen: React.FC<HomeMapScreenProps> = ({ onSpotDetails }) => {
  const { coords } = useLocation();
  const {
    spots,
    loading: spotsLoading,
    filters,
    setSportFilter,
    setAccessFilter,
  } = useSpots(coords);

  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const activeSportColor = selectedSport
    ? getSportById(selectedSport)?.color ?? Colors.accent
    : Colors.accent;

  const handleSportSelect = (sportId: string) => {
    const newSport = sportId === selectedSport ? null : sportId;
    setSelectedSport(newSport);
    setSportFilter(newSport);
  };

  return (
    <View style={styles.container}>
      {/* Fond carte — placeholder en attendant le build EAS */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapTitle}>Carte interactive</Text>
          <Text style={styles.mapSubtitle}>
            Disponible dans le build final avec{'\n'}les marqueurs colorés par sport
          </Text>

          {/* Aperçu du nombre de spots */}
          {spotsLoading ? (
            <ActivityIndicator color={activeSportColor} style={{ marginTop: 16 }} />
          ) : spots.length > 0 ? (
            <View style={[styles.spotBubble, { borderColor: activeSportColor }]}>
              <Text style={[styles.spotBubbleText, { color: activeSportColor }]}>
                {spots.length} spots {selectedSport ? getSportById(selectedSport)?.name : ''} autour de toi
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Header flottant */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Animated.View entering={FadeIn} style={styles.header}>
          <FieldzLogo size="small" color={activeSportColor} />
        </Animated.View>
      </SafeAreaView>

      {/* Barre de sports en bas */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarTitle}>Choisis un sport</Text>
        <View style={styles.sportsGrid}>
          {ALL_SPORTS.map(sport => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportButton,
                selectedSport === sport.id && {
                  backgroundColor: sport.color + '25',
                  borderColor: sport.color,
                },
              ]}
              onPress={() => handleSportSelect(sport.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
              <Text
                style={[
                  styles.sportName,
                  selectedSport === sport.id && { color: sport.color },
                ]}
                numberOfLines={1}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapArea: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  mapTitle: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxl,
    color: Colors.text,
  },
  mapSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  spotBubble: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.backgroundCard,
  },
  spotBubbleText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.sm,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bottomBar: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomBarTitle: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
