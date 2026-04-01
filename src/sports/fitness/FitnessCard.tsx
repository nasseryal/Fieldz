// Carte résumée Fitness
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes } from '../../constants/typography';
import { Spot } from '../../types';
import { AccessBadge } from '../../components/AccessBadge';
import { sportConfig } from './fitness.config';

interface Props { spot: Spot; distance?: string; onPress: () => void; }

const FitnessCard: React.FC<Props> = ({ spot, distance, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    {spot.photos.length > 0 ? (
      <Image source={{ uri: spot.photos[0] }} style={styles.photo} />
    ) : (
      <View style={[styles.photoPlaceholder, { backgroundColor: sportConfig.color + '20' }]}>
        <Text style={styles.placeholderEmoji}>{sportConfig.emoji}</Text>
      </View>
    )}
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>{spot.nom}</Text>
      <Text style={styles.location} numberOfLines={1}>📍 {spot.ville} {distance ? `· ${distance}` : ''}</Text>
      <AccessBadge acces={spot.acces} prixEstime={spot.prixEstime} size="small" />
    </View>
  </TouchableOpacity>
);

export default FitnessCard;

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#242424', borderRadius: 14, overflow: 'hidden', gap: 12, padding: 10 },
  photo: { width: 70, height: 70, borderRadius: 10 },
  photoPlaceholder: { width: 70, height: 70, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 28 },
  info: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: '#FFFFFF' },
  location: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#999999' },
});
