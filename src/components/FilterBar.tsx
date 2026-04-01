// Barre de filtres — sélection du sport et du type d'accès (gratuit/payant)
// C'est le "menu" en haut de la carte qui permet de choisir quel sport afficher
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { ALL_SPORTS } from '../constants/sports';
import { MapFilters } from '../types';

interface FilterBarProps {
  filters: MapFilters;
  onSportChange: (sportId: string | null) => void;
  onAccessChange: (acces: 'tous' | 'gratuit' | 'payant') => void;
}


export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onSportChange,
  onAccessChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Rangée 1 : Filtres par sport (scroll horizontal) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportsRow}
      >
        {/* Un bouton par sport */}
        {ALL_SPORTS.map(sport => (
          <SportChip
            key={sport.id}
            label={sport.name}
            emoji={sport.emoji}
            color={sport.color}
            isActive={filters.sport === sport.id}
            onPress={() => onSportChange(sport.id)}
          />
        ))}
      </ScrollView>

      {/* Rangée 2 : Filtres par accès */}
      <View style={styles.accessRow}>
        <AccessChip
          label="Tous"
          isActive={filters.acces === 'tous'}
          onPress={() => onAccessChange('tous')}
        />
        <AccessChip
          label="🆓 Gratuit"
          isActive={filters.acces === 'gratuit'}
          color={Colors.gratuit}
          onPress={() => onAccessChange('gratuit')}
        />
        <AccessChip
          label="💰 Payant"
          isActive={filters.acces === 'payant'}
          color={Colors.payant}
          onPress={() => onAccessChange('payant')}
        />
      </View>
    </View>
  );
};

// Chip pour un sport (ex: ⚽ Football)
const SportChip: React.FC<{
  label: string;
  emoji: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, emoji, color, isActive, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.sportChip,
        {
          backgroundColor: isActive ? color + '30' : 'transparent',
          borderColor: isActive ? color : Colors.border,
          transform: [{ scale: isActive ? 1.05 : 1 }],
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.sportEmoji, isActive && styles.sportEmojiActive]}>
        {emoji}
      </Text>
      <Text
        style={[
          styles.sportLabel,
          isActive && { color: color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Chip pour le type d'accès (Gratuit / Payant)
const AccessChip: React.FC<{
  label: string;
  isActive: boolean;
  color?: string;
  onPress: () => void;
}> = ({ label, isActive, color, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.accessChip,
      isActive && {
        backgroundColor: (color ?? Colors.text) + '20',
        borderColor: color ?? Colors.text,
      },
    ]}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.accessLabel,
        isActive && { color: color ?? Colors.text },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sportsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    flexDirection: 'row',
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportEmojiActive: {
    fontSize: 22,
  },
  sportLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  accessRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  accessChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accessLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
