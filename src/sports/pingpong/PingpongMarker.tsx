// Marqueur Ping-pong sur la carte
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Spot } from '../../types';
import { sportConfig } from './pingpong.config';

interface Props { spot: Spot; isSelected?: boolean; }

const PingpongMarker: React.FC<Props> = ({ spot, isSelected = false }) => (
  <Animated.View entering={ZoomIn.springify().damping(15)} style={styles.container}>
    {isSelected && <View style={[styles.halo, { backgroundColor: sportConfig.color + '40' }]} />}
    <View style={[styles.marker, { backgroundColor: sportConfig.color + '20', borderColor: sportConfig.color }, isSelected && styles.markerSelected]}>
      <Text style={styles.emoji}>{sportConfig.emoji}</Text>
      {spot.acces === 'payant' && <View style={styles.paidBadge}><Text style={styles.paidText}>€</Text></View>}
    </View>
  </Animated.View>
);

export default PingpongMarker;

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 56, height: 56, borderRadius: 28 },
  marker: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  markerSelected: { width: 50, height: 50, borderRadius: 25, borderWidth: 3 },
  emoji: { fontSize: 20 },
  paidBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF9800', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  paidText: { fontSize: 9, fontWeight: 'bold', color: '#FFFFFF' },
});
