// ============================================================
// TEMPLATE — Marqueur sur la carte pour un spot
// ============================================================
// Ce composant affiche l'emoji du sport sur la carte Google Maps
// Les spots payants ont un petit badge "€"
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Spot } from '../../types';
import { sportConfig } from './sport.config';

interface SportMarkerProps {
  spot: Spot;
  isSelected?: boolean;
}

const SportMarker: React.FC<SportMarkerProps> = ({ spot, isSelected = false }) => {
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(15)}
      style={styles.container}
    >
      {/* Halo pulsant quand le marqueur est sélectionné */}
      {isSelected && (
        <View style={[styles.halo, { backgroundColor: sportConfig.color + '40' }]} />
      )}

      {/* Le marqueur principal */}
      <View
        style={[
          styles.marker,
          {
            backgroundColor: sportConfig.color + '20',
            borderColor: sportConfig.color,
          },
          isSelected && styles.markerSelected,
        ]}
      >
        <Text style={styles.emoji}>{sportConfig.emoji}</Text>

        {/* Badge € pour les spots payants */}
        {spot.acces === 'payant' && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>€</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default SportMarker;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  marker: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  emoji: {
    fontSize: 20,
  },
  paidBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF9800',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
