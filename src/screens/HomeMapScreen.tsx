// Écran Carte — home page avec carte Google Maps plein écran + marqueurs colorés
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { MAX_VISIBLE_MARKERS } from '../constants/app';
import { FontSizes } from '../constants/typography';
import { darkMapStyle } from '../constants/mapStyle';
import { getSportById, ALL_SPORTS } from '../constants/sports';
import { Spot } from '../types';
import { FieldzLogo } from '../components/FieldzLogo';
import { AccessBadge } from '../components/AccessBadge';
import { useLocation } from '../hooks/useLocation';
import { useSpots } from '../hooks/useSpots';
import { getDistanceKm } from '../services/spots';

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
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const mapRef = useRef<MapView>(null);
  const hascentered = useRef(false);

  // Centre la carte sur le GPS dès qu'on a la vraie position (pas Paris)
  useEffect(() => {
    if (!hascentered.current && coords.latitude !== 48.8566 && coords.longitude !== 2.3522) {
      hascentered.current = true;
      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  }, [coords.latitude, coords.longitude]);

  const activeSportColor = selectedSport
    ? getSportById(selectedSport)?.color ?? Colors.accent
    : Colors.accent;

  const handleSportSelect = (sportId: string) => {
    const newSport = sportId === selectedSport ? null : sportId;
    setSelectedSport(newSport);
    setSportFilter(newSport);
    setSelectedSpot(null);
  };

  // Quand on tape sur un marqueur
  const handleMarkerPress = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    mapRef.current?.animateToRegion({
      latitude: spot.latitude,
      longitude: spot.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 300);
  }, []);

  // Ouvre le GPS pour naviguer vers un spot
  const handleNavigate = async (spot: Spot) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${spot.latitude},${spot.longitude}`,
      android: `google.navigation:q=${spot.latitude},${spot.longitude}`,
    });
    try {
      if (url) await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la navigation.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Carte Google Maps plein écran */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedSpot(null)}
      >
        {/* Marqueurs des spots (max 200 pour la performance) */}
        {spots.slice(0, MAX_VISIBLE_MARKERS).map(spot => {
          const sport = getSportById(spot.sport);
          const isSelected = selectedSpot?.id === spot.id;
          return (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              onPress={() => handleMarkerPress(spot)}
              tracksViewChanges={false}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleMarkerPress(spot)}
              >
                <View style={[
                  styles.marker,
                  {
                    backgroundColor: (sport?.color ?? Colors.accent) + '20',
                    borderColor: sport?.color ?? Colors.accent,
                  },
                  isSelected && styles.markerSelected,
                ]}>
                  <Text style={[styles.markerEmoji, isSelected && styles.markerEmojiSelected]}>
                    {sport?.emoji ?? '📍'}
                  </Text>
                  {spot.acces === 'payant' && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>€</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Marker>
          );
        })}
      </MapView>

      {/* Header flottant */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Animated.View entering={FadeIn} style={styles.header}>
          <FieldzLogo size="small" color={activeSportColor} />
          {spotsLoading && (
            <ActivityIndicator color={activeSportColor} size="small" />
          )}
          {!spotsLoading && spots.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: activeSportColor + '30' }]}>
              <Text style={[styles.countText, { color: activeSportColor }]}>
                {spots.length} spots
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* Bottom sheet quand un spot est sélectionné */}
      {selectedSpot && (
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown}
          style={styles.bottomSheet}
        >
          <TouchableOpacity onPress={() => setSelectedSpot(null)} style={styles.handleBar}>
            <View style={styles.handle} />
          </TouchableOpacity>
          <View style={styles.bottomSheetContent}>
            <View style={[styles.sheetIcon, { backgroundColor: (getSportById(selectedSpot.sport)?.color ?? Colors.accent) + '20' }]}>
              <Text style={{ fontSize: 28 }}>{getSportById(selectedSpot.sport)?.emoji ?? '📍'}</Text>
            </View>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetName} numberOfLines={1}>{selectedSpot.nom}</Text>
              <Text style={styles.sheetMeta} numberOfLines={1}>
                📍 {(() => {
                  const d = getDistanceKm(coords.latitude, coords.longitude, selectedSpot.latitude, selectedSpot.longitude);
                  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                })()} · {selectedSpot.ville}
              </Text>
              <AccessBadge acces={selectedSpot.acces} size="small" />
            </View>
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: getSportById(selectedSpot.sport)?.color ?? Colors.accent }]}
              onPress={() => { onSpotDetails(selectedSpot); setSelectedSpot(null); }}
            >
              <Text style={styles.sheetButtonText}>Détails</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonOutline]}
              onPress={() => handleNavigate(selectedSpot)}
            >
              <Text style={[styles.sheetButtonText, { color: Colors.text }]}>Y aller 🧭</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Bouton recentrer sur ma position */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={() => {
          mapRef.current?.animateToRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 500);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.recenterIcon}>📍</Text>
      </TouchableOpacity>

      {/* Barre de sports en bas */}
      {!selectedSpot && (
        <View style={styles.bottomBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsScroll}>
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
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Marqueurs
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerSelected: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  markerEmoji: {
    fontSize: 18,
  },
  markerEmojiSelected: {
    fontSize: 22,
  },
  paidBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF9800',
    width: 15,
    height: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Header
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.xs,
  },
  // Bottom sheet spot
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  bottomSheetContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  sheetIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetInfo: {
    flex: 1,
    gap: 3,
  },
  sheetName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  sheetMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  sheetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheetButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
  },
  // Barre de sports
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard + 'F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sportsScroll: {
    paddingHorizontal: 16,
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
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterIcon: {
    fontSize: 20,
  },
});
