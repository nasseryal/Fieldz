// Placeholder de carte — utilisé dans Expo Go car react-native-maps nécessite un build custom
// Sera remplacé par la vraie carte Google Maps dans le build EAS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';

interface MapPlaceholderProps {
  children?: React.ReactNode;
  style?: any;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ children, style }) => (
  <View style={[styles.container, style]}>
    <Text style={styles.emoji}>🗺️</Text>
    <Text style={styles.title}>Carte en mode preview</Text>
    <Text style={styles.subtitle}>
      La vraie carte apparaîtra dans le build final
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xl,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
