// Carrousel de photos — glisse horizontalement pour voir les photos d'un spot
import React from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_WIDTH = SCREEN_WIDTH - 32;
const PHOTO_HEIGHT = 220;

interface PhotoCarouselProps {
  photos: string[];
  sportEmoji?: string;
  sportColor?: string;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  sportEmoji = '📍',
  sportColor = Colors.accent,
}) => {
  if (photos.length === 0) {
    return (
      <View style={[styles.placeholder, { backgroundColor: sportColor + '20' }]}>
        <Text style={styles.placeholderEmoji}>{sportEmoji}</Text>
        <Text style={styles.placeholderText}>Pas encore de photo</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.container}
      >
        {photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.photo}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Indicateur de page (les petits points) */}
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  placeholder: {
    height: PHOTO_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },
});
