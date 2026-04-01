// Écran Explorer — grille de tous les sports disponibles
// Comme un menu visuel pour découvrir les sports
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';
import { ALL_SPORTS } from '../constants/sports';
import { FieldzLogo } from '../components/FieldzLogo';
import { SportConfig } from '../types';

interface ExploreScreenProps {
  onSportSelect: (sportId: string) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onSportSelect }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FieldzLogo size="small" />
          <Text style={styles.title}>Explorer</Text>
          <Text style={styles.subtitle}>
            Découvre tous les sports disponibles
          </Text>
        </View>

        {/* Grille de sports */}
        <View style={styles.grid}>
          {ALL_SPORTS.map((sport, index) => (
            <SportTile
              key={sport.id}
              sport={sport}
              index={index}
              onPress={() => onSportSelect(sport.id)}
            />
          ))}
        </View>

        {/* Bas de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ➕ D'autres sports arrivent bientôt !
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Tuile d'un sport dans la grille
const SportTile: React.FC<{
  sport: SportConfig;
  index: number;
  onPress: () => void;
}> = ({ sport, index, onPress }) => (
  <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
    <TouchableOpacity
      style={[styles.tile, { borderColor: sport.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.tileIcon, { backgroundColor: sport.color + '20' }]}>
        <Text style={styles.tileEmoji}>{sport.emoji}</Text>
      </View>
      <Text style={styles.tileName}>{sport.name}</Text>
      <View style={[styles.tileAccent, { backgroundColor: sport.color }]} />
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  tile: {
    width: '47%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 160,
  },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileEmoji: {
    fontSize: 28,
  },
  tileName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  tileAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
