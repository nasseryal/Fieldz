// ============================================================
// TEMPLATE — Carte résumée d'un spot (utilisée dans les listes)
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes } from '../../constants/typography';
import { Spot } from '../../types';
import { AccessBadge } from '../../components/AccessBadge';
import { sportConfig } from './sport.config';

interface SportCardProps {
  spot: Spot;
  distance?: string;
  onPress: () => void;
}

const SportCard: React.FC<SportCardProps> = ({ spot, distance, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Photo ou placeholder */}
      {spot.photos.length > 0 ? (
        <Image source={{ uri: spot.photos[0] }} style={styles.photo} />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: sportConfig.color + '20' }]}>
          <Text style={styles.placeholderEmoji}>{sportConfig.emoji}</Text>
        </View>
      )}

      {/* Infos */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{spot.nom}</Text>
        <Text style={styles.location} numberOfLines={1}>
          📍 {spot.ville} {distance ? `· ${distance}` : ''}
        </Text>
        <AccessBadge acces={spot.acces} prixEstime={spot.prixEstime} size="small" />
      </View>
    </TouchableOpacity>
  );
};

export default SportCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 12,
    padding: 10,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  photoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  location: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
