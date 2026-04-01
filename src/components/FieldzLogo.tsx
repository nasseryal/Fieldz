// Logo Fieldz — "Field" en blanc + "z" qui change de couleur selon le sport actif
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSizes } from '../constants/typography';
import { Colors } from '../constants/colors';

interface FieldzLogoProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { fontSize: 22, iconSize: 16 },
  medium: { fontSize: 32, iconSize: 22 },
  large: { fontSize: 48, iconSize: 32 },
};

export const FieldzLogo: React.FC<FieldzLogoProps> = ({
  color = Colors.accent,
  size = 'medium',
}) => {
  const { fontSize } = SIZES[size];

  return (
    <View style={styles.container}>
      <Text style={[styles.mapPin, { fontSize: fontSize * 0.6, color }]}>📍</Text>
      <Text style={[styles.field, { fontSize }]}>Field</Text>
      <Text style={[styles.z, { fontSize, color }]}>z</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPin: {
    marginRight: 4,
  },
  field: {
    fontFamily: 'BarlowCondensed_700Bold',
    color: Colors.text,
  },
  z: {
    fontFamily: 'BarlowCondensed_700Bold',
  },
});
