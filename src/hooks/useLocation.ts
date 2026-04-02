// Hook de géolocalisation — récupère la position GPS de l'utilisateur
// Comme un GPS de voiture mais pour trouver les terrains de sport
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coords } from '../types';

// Position par défaut : Paris (si le GPS ne marche pas)
const DEFAULT_COORDS: Coords = {
  latitude: 48.8566,
  longitude: 2.3522,
};

export const useLocation = () => {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Demande la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        setLoading(false);
        return;
      }

      // Récupère la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      setError('Impossible de récupérer ta position');
      // Erreur GPS — position par défaut utilisée
    } finally {
      setLoading(false);
    }
  };

  return { coords, loading, error };
};
