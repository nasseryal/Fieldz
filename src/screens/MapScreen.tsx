// Écran Liste — recherche et résultats triés par distance
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';
import { getSportById } from '../constants/sports';
import { Spot, Coords } from '../types';
import { FieldzLogo } from '../components/FieldzLogo';
import { FilterBar } from '../components/FilterBar';
import { AccessBadge } from '../components/AccessBadge';
import { useLocation } from '../hooks/useLocation';
import { useSpots } from '../hooks/useSpots';
import { getDistanceKm } from '../services/spots';

// API gratuite pour convertir une adresse en coordonnées GPS
const geocodeAddress = async (text: string): Promise<Coords | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)},France&limit=1`,
      { headers: { 'User-Agent': 'Fieldz-App' } }
    );
    const data = await response.json();
    if (data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
};

interface MapScreenProps {
  onSpotDetails: (spot: Spot) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onSpotDetails }) => {
  const { coords: gpsCoords } = useLocation();
  const [searchCoords, setSearchCoords] = useState<Coords | null>(null);
  const [searchLabel, setSearchLabel] = useState('');
  const [searching, setSearching] = useState(false);

  // Utilise les coordonnées de recherche si disponibles, sinon le GPS
  const activeCoords = searchCoords ?? gpsCoords;

  const {
    spots,
    loading: spotsLoading,
    filters,
    setSportFilter,
    setAccessFilter,
  } = useSpots(activeCoords);

  const [searchText, setSearchText] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Reset à 10 quand on change de sport
  React.useEffect(() => {
    setVisibleCount(10);
  }, [filters.sport]);

  // Recherche dans les résultats locaux (nom, ville, adresse)
  const filteredSpots = useMemo(() => {
    if (!searchText.trim()) return spots;
    const query = searchText.toLowerCase().trim();
    return spots.filter(s =>
      s.nom.toLowerCase().includes(query) ||
      s.ville.toLowerCase().includes(query) ||
      s.adresse.toLowerCase().includes(query) ||
      s.codePostal.includes(query)
    );
  }, [spots, searchText]);

  const visibleSpots = filteredSpots.slice(0, visibleCount);

  const activeSportColor = filters.sport
    ? getSportById(filters.sport)?.color ?? Colors.accent
    : Colors.accent;

  // Recherche d'un lieu (ville, adresse) pour recentrer les résultats
  const handleSearch = async () => {
    const text = searchText.trim();
    if (!text || text.length < 2) return;

    // D'abord on filtre localement
    if (filteredSpots.length > 0) return;

    // Sinon on cherche comme un lieu pour recentrer
    setSearching(true);
    const newCoords = await geocodeAddress(text);
    setSearching(false);

    if (newCoords) {
      setSearchCoords(newCoords);
      setSearchLabel(text);
      setVisibleCount(10);
    } else {
      Alert.alert('Lieu introuvable', `Aucun résultat pour "${text}"`);
    }
  };

  // Réinitialiser la recherche de lieu
  const clearSearchLocation = () => {
    setSearchCoords(null);
    setSearchLabel('');
    setSearchText('');
  };

  const renderSpot = useCallback(({ item, index }: { item: Spot; index: number }) => {
    const sport = getSportById(item.sport);
    const distance = getDistanceKm(
      activeCoords.latitude, activeCoords.longitude,
      item.latitude, item.longitude
    );
    const distanceText = distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60).springify()}>
        <TouchableOpacity
          style={styles.spotCard}
          onPress={() => onSpotDetails(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.spotIcon, { backgroundColor: (sport?.color ?? Colors.accent) + '20' }]}>
            <Text style={styles.spotEmoji}>{sport?.emoji ?? '📍'}</Text>
            {item.acces === 'payant' && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>€</Text>
              </View>
            )}
          </View>

          <View style={styles.spotInfo}>
            <Text style={styles.spotName} numberOfLines={1}>{item.nom}</Text>
            <Text style={styles.spotMeta} numberOfLines={1}>
              {sport?.emoji} {sport?.name} · 📍 {distanceText}
            </Text>
            <Text style={styles.spotAddress} numberOfLines={1}>
              {item.ville || item.adresse}
            </Text>
          </View>

          <AccessBadge acces={item.acces} size="small" />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [activeCoords, onSpotDetails]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeIn} style={styles.header}>
          <View style={styles.headerTop}>
            <FieldzLogo size="small" color={activeSportColor} />
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Nom, ville, adresse..."
                placeholderTextColor={Colors.textMuted}
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setVisibleCount(10);
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searching && (
                <ActivityIndicator
                  size="small"
                  color={Colors.accent}
                  style={styles.searchSpinner}
                />
              )}
            </View>
          </View>

          {/* Badge lieu recherché */}
          {searchLabel ? (
            <View style={styles.searchLocationRow}>
              <Text style={styles.searchLocationText}>
                📍 Résultats autour de : {searchLabel}
              </Text>
              <TouchableOpacity onPress={clearSearchLocation}>
                <Text style={styles.searchLocationClear}>✕ Ma position</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Filtres sport + accès */}
          <FilterBar
            filters={filters}
            onSportChange={setSportFilter}
            onAccessChange={setAccessFilter}
          />
        </Animated.View>
      </SafeAreaView>

      {/* Liste des spots */}
      <FlatList
        data={visibleSpots}
        renderItem={renderSpot}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {!filters.sport ? '👆' : spotsLoading ? '⏳' : '🏟️'}
            </Text>
            <Text style={styles.emptyTitle}>
              {!filters.sport
                ? 'Choisis un sport'
                : spotsLoading
                ? 'Chargement...'
                : 'Aucun spot trouvé'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {!filters.sport
                ? 'Sélectionne un sport ci-dessus pour voir les terrains'
                : spotsLoading
                ? 'On cherche les terrains...'
                : 'Essaie une autre recherche ou ajoute un spot !'}
            </Text>
          </View>
        }
        ListFooterComponent={
          visibleCount < filteredSpots.length ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleCount(prev => prev + 10)}
              activeOpacity={0.7}
            >
              <Text style={styles.loadMoreText}>
                Voir plus ({filteredSpots.length - visibleCount} restants)
              </Text>
            </TouchableOpacity>
          ) : null
        }
        ListHeaderComponent={
          filteredSpots.length > 0 ? (
            <Text style={styles.spotCount}>
              {filteredSpots.length} {filteredSpots.length > 1 ? 'spots' : 'spot'} {filters.sport ? getSportById(filters.sport)?.name : ''}
              {searchLabel ? ` autour de ${searchLabel}` : ' à proximité'}
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchSpinner: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchLocationText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.xs,
    color: Colors.accent,
    flex: 1,
  },
  searchLocationClear: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    paddingLeft: 12,
  },
  spotCount: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  spotIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotEmoji: {
    fontSize: 24,
  },
  paidBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  spotInfo: {
    flex: 1,
    gap: 2,
  },
  spotName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  spotMeta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  spotAddress: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xl,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
