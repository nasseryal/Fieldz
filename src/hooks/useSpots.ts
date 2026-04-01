// Hook des spots — charge les spots UNIQUEMENT quand un sport est sélectionné
import { useState, useEffect, useCallback, useRef } from 'react';
import { Spot, MapFilters, Coords } from '../types';
import { getSpotsBySportNearby, filterSpotsByDistance } from '../services/spots';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { DEFAULT_RADIUS_KM, DEDUP_DISTANCE_THRESHOLD } from '../constants/app';

export const useSpots = (coords: Coords) => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(DEFAULT_RADIUS_KM);
  const [filters, setFilters] = useState<MapFilters>({
    sport: null,
    acces: 'tous',
  });

  const cache = useRef<Record<string, Spot[]>>({});
  const lastCoords = useRef({ lat: 0, lon: 0 });
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  // Charge les spots d'un sport
  const loadSportSpots = useCallback(async (sportId: string) => {
    if (cache.current[sportId]) {
      setSpots(cache.current[sportId]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sportSpots = await getSpotsBySportNearby(sportId, coordsRef.current);
      cache.current[sportId] = sportSpots;
      setSpots(sportSpots);
      // Met à jour sportsExplores dans le profil
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            sportsExplores: arrayUnion(sportId),
          });
        } catch { /* pas grave si ça échoue */ }
      }
    } catch {
      setError('Impossible de charger les spots. Vérifie ta connexion.');
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Quand le sport ou les coordonnées changent
  useEffect(() => {
    const movedSignificantly =
      Math.abs(coords.latitude - lastCoords.current.lat) > 0.01 ||
      Math.abs(coords.longitude - lastCoords.current.lon) > 0.01;

    if (movedSignificantly) {
      cache.current = {};
      lastCoords.current = { lat: coords.latitude, lon: coords.longitude };
    }

    if (filters.sport) {
      loadSportSpots(filters.sport);
    } else {
      setSpots([]);
      setFilteredSpots([]);
    }
  }, [filters.sport, coords.latitude, coords.longitude, loadSportSpots]);

  // Applique les filtres accès + distance + tri + dédup
  useEffect(() => {
    let result = [...spots];

    if (filters.acces !== 'tous') {
      result = result.filter(s => s.acces === filters.acces);
    }

    result = filterSpotsByDistance(result, coords, distanceKm);

    result.sort((a, b) => {
      const distA = Math.pow(a.latitude - coords.latitude, 2) + Math.pow(a.longitude - coords.longitude, 2);
      const distB = Math.pow(b.latitude - coords.latitude, 2) + Math.pow(b.longitude - coords.longitude, 2);
      return distA - distB;
    });

    const unique: typeof result = [];
    for (const spot of result) {
      const isDuplicate = unique.some(
        s => Math.abs(s.latitude - spot.latitude) < DEDUP_DISTANCE_THRESHOLD &&
             Math.abs(s.longitude - spot.longitude) < DEDUP_DISTANCE_THRESHOLD
      );
      if (!isDuplicate) unique.push(spot);
    }

    setFilteredSpots(unique);
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
    error,
    filters,
    distanceKm,
    setDistanceKm,
    setSportFilter,
    setAccessFilter,
    refreshSpots: () => filters.sport && loadSportSpots(filters.sport),
  };
};
