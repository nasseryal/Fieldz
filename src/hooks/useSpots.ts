// Hook des spots — charge les spots UNIQUEMENT quand un sport est sélectionné
import { useState, useEffect, useCallback, useRef } from 'react';
import { Spot, MapFilters, Coords } from '../types';
import { getSpotsBySportNearby, filterSpotsByDistance } from '../services/spots';

export const useSpots = (coords: Coords) => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState(10);
  const [filters, setFilters] = useState<MapFilters>({
    sport: null,
    acces: 'tous',
  });

  // Cache : garde les spots déjà chargés par sport (pas besoin de re-requêter)
  const cache = useRef<Record<string, Spot[]>>({});

  // Quand le sport ou les coordonnées changent → on charge les spots
  useEffect(() => {
    if (filters.sport) {
      // Vide le cache si les coordonnées ont changé
      cache.current = {};
      loadSportSpots(filters.sport);
    } else {
      setSpots([]);
      setFilteredSpots([]);
    }
  }, [filters.sport, coords.latitude, coords.longitude]);

  useEffect(() => {
    applyFilters();
  }, [spots, filters.acces, distanceKm]);

  // Charge les spots — utilise le cache si déjà chargé
  const loadSportSpots = async (sportId: string) => {
    // Si déjà en cache → affichage instantané
    if (cache.current[sportId]) {
      setSpots(cache.current[sportId]);
      return;
    }

    try {
      setLoading(true);
      const sportSpots = await getSpotsBySportNearby(sportId, coords);
      cache.current[sportId] = sportSpots; // Sauvegarde en cache
      setSpots(sportSpots);
    } catch (error) {
      console.error('Erreur chargement spots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Applique les filtres accès + distance
  const applyFilters = useCallback(() => {
    let result = [...spots];

    if (filters.acces !== 'tous') {
      result = result.filter(s => s.acces === filters.acces);
    }

    result = filterSpotsByDistance(result, coords, distanceKm);

    // Trie du plus proche au plus loin
    result.sort((a, b) => {
      const distA = Math.pow(a.latitude - coords.latitude, 2) + Math.pow(a.longitude - coords.longitude, 2);
      const distB = Math.pow(b.latitude - coords.latitude, 2) + Math.pow(b.longitude - coords.longitude, 2);
      return distA - distB;
    });

    // Anti-doublons : retire les spots à moins de 30m l'un de l'autre
    const unique: typeof result = [];
    for (const spot of result) {
      const isDuplicate = unique.some(
        s => Math.abs(s.latitude - spot.latitude) < 0.0003 &&
             Math.abs(s.longitude - spot.longitude) < 0.0003
      );
      if (!isDuplicate) unique.push(spot);
    }
    result = unique;

    setFilteredSpots(result);
  }, [spots, filters.acces, coords, distanceKm]);

  const setSportFilter = (sportId: string | null) => {
    setFilters(prev => ({ ...prev, sport: sportId }));
  };

  const setAccessFilter = (acces: 'tous' | 'gratuit' | 'payant') => {
    setFilters(prev => ({ ...prev, acces }));
  };

  return {
    spots: filteredSpots,
    allSpots: spots,
    loading,
    filters,
    distanceKm,
    setDistanceKm,
    setSportFilter,
    setAccessFilter,
    refreshSpots: () => filters.sport && loadSportSpots(filters.sport),
  };
};
