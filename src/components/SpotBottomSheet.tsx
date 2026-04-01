// Bottom Sheet — la fiche résumée qui apparaît quand on tape sur un marqueur
// C'est comme une carte de visite du terrain
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';
import { Spot } from '../types';
import { getSportById } from '../constants/sports';
import { getDistanceKm } from '../services/spots';
import { AccessBadge } from './AccessBadge';

interface SpotBottomSheetProps {
  spot: Spot;
  userLat: number;
  userLon: number;
  onClose: () => void;
  onDetails: () => void;
}

export const SpotBottomSheet: React.FC<SpotBottomSheetProps> = ({
  spot,
  userLat,
  userLon,
  onClose,
  onDetails,
}) => {
  const sport = getSportById(spot.sport);
  const distance = getDistanceKm(userLat, userLon, spot.latitude, spot.longitude);
  const distanceText = distance < 1
    ? `${Math.round(distance * 1000)} m`
    : `${distance.toFixed(1)} km`;

  // Ouvre Google Maps / Apple Plans pour la navigation
  const handleNavigate = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${spot.latitude},${spot.longitude}`,
      android: `google.navigation:q=${spot.latitude},${spot.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20)}
      exiting={SlideOutDown}
      style={styles.container}
    >
      {/* Barre de fermeture */}
      <TouchableOpacity onPress={onClose} style={styles.handleBar}>
        <View style={styles.handle} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Photo du spot (si disponible) */}
        {spot.photos.length > 0 ? (
          <Image source={{ uri: spot.photos[0] }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: sport?.color + '30' }]}>
            <Text style={styles.placeholderEmoji}>{sport?.emoji ?? '📍'}</Text>
          </View>
        )}

        {/* Infos principales */}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>{spot.nom}</Text>
            <AccessBadge acces={spot.acces} prixEstime={spot.prixEstime} />
          </View>

          <View style={styles.meta}>
            <Text style={styles.sport}>
              {sport?.emoji} {sport?.name}
            </Text>
            <Text style={styles.distance}>📍 {distanceText}</Text>
          </View>

          <Text style={styles.adresse} numberOfLines={1}>
            {spot.adresse}, {spot.ville}
          </Text>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: sport?.color ?? Colors.accent }]}
              onPress={onDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Détails</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={handleNavigate}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: Colors.text }]}>Y aller 🧭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 14,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.lg,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  sport: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  distance: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  adresse: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  buttonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
  },
});
