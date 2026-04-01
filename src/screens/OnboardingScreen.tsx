// Écran d'onboarding — les 3 slides de bienvenue
// C'est la première chose que voit un nouvel utilisateur
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { FieldzLogo } from '../components/FieldzLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: '1',
    emoji: '🗺️',
    title: 'Trouve ton terrain',
    description: 'Découvre les spots sportifs autour de toi — terrains de foot, basket, tennis et bien plus.',
    emojis: ['📍', '⚽', '🏀', '🎾', '🏃'],
  },
  {
    id: '2',
    emoji: '🏟️',
    title: 'Tous les sports',
    description: 'Football, basket, skate, fitness, pétanque... Plus de 10 sports recensés partout en France.',
    emojis: ['⚽', '🏀', '🎾', '🎳', '🛹', '🏸', '🏐', '🏓', '🏃', '💪'],
  },
  {
    id: '3',
    emoji: '🤝',
    title: 'Gratuit et communautaire',
    description: 'Ajoute les spots que tu connais, aide les autres sportifs à trouver leur terrain.',
    emojis: ['📸', '❤️', '🌟', '🗺️'],
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      {/* Grille d'emojis animée */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.emojiGrid}>
        {item.emojis.map((emoji, index) => (
          <Animated.Text
            key={index}
            entering={FadeInUp.delay(300 + index * 100).springify()}
            style={styles.gridEmoji}
          >
            {emoji}
          </Animated.Text>
        ))}
      </Animated.View>

      {/* Texte */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.textContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Logo en haut */}
      <Animated.View entering={FadeIn} style={styles.logoContainer}>
        <FieldzLogo size="large" />
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />

      {/* Indicateurs (petits points) */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Bouton */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {currentIndex === SLIDES.length - 1 ? 'Commencer 🚀' : 'Suivant'}
        </Text>
      </TouchableOpacity>

      {/* Lien "Passer" */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 20,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  gridEmoji: {
    fontSize: 42,
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  button: {
    marginHorizontal: 40,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
