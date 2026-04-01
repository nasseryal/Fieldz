// Badge d'accès — affiche "Gratuit", "Payant" ou "Mixte" avec la bonne couleur
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';

interface AccessBadgeProps {
  acces: 'gratuit' | 'payant' | 'mixte';
  prixEstime?: string;
  size?: 'small' | 'normal';
}

const BADGE_CONFIG = {
  gratuit: { label: 'Gratuit', color: Colors.gratuit },
  payant: { label: 'Payant', color: Colors.payant },
  mixte: { label: 'Mixte', color: Colors.mixte },
};

export const AccessBadge: React.FC<AccessBadgeProps> = ({
  acces,
  prixEstime,
  size = 'normal',
}) => {
  const config = BADGE_CONFIG[acces];
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20' }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.label, { color: config.color }, isSmall && styles.labelSmall]}>
        {config.label}
      </Text>
      {prixEstime && (
        <Text style={[styles.price, { color: config.color }]}>{prixEstime}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.xs,
  },
  labelSmall: {
    fontSize: 9,
  },
  price: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
  },
});
