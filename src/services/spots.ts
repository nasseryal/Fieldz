// Service des spots — gère la lecture/écriture des terrains de sport dans Firestore
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Spot, Coords } from '../types';
import { FIRESTORE_SPOTS_LIMIT, NEARBY_DEPARTMENTS_COUNT } from '../constants/app';

const SPOTS_COLLECTION = 'spots';

// Récupère les spots d'un sport dans les départements proches
export const getSpotsBySportNearby = async (
  sportId: string,
  coords: Coords
): Promise<Spot[]> => {
  const deps = getNearbyDepartments(coords.latitude, coords.longitude);

  // Lance toutes les requêtes en parallèle (8 en même temps au lieu d'une par une)
  const promises = deps.map(dep => {
    const minCP = dep.length === 2 ? dep + '000' : dep + '00';
    const maxCP = dep.length === 2 ? dep + '999' : dep + '99';

    const q = query(
      collection(db, SPOTS_COLLECTION),
      where('sport', '==', sportId),
      where('codePostal', '>=', minCP),
      where('codePostal', '<=', maxCP),
      limit(FIRESTORE_SPOTS_LIMIT)
    );
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const allSpots = snapshots.flatMap(snap =>
    snap.docs.map(d => ({ id: d.id, ...d.data() } as Spot))
  );

  return allSpots;
};

// Récupère les spots proches en cherchant par code postal (département)
export const getAllSpots = async (coords?: Coords): Promise<Spot[]> => {
  try {
    // Trouve les départements proches des coordonnées GPS
    const deps = coords
      ? getNearbyDepartments(coords.latitude, coords.longitude)
      : ['75', '92', '93', '94']; // Paris par défaut

    const allSpots: Spot[] = [];

    // Requête par département (via le code postal)
    for (const dep of deps) {
      const minCP = dep.length === 2 ? dep + '000' : dep + '00';
      const maxCP = dep.length === 2 ? dep + '999' : dep + '99';

      const q = query(
        collection(db, SPOTS_COLLECTION),
        where('codePostal', '>=', minCP),
        where('codePostal', '<=', maxCP),
        limit(FIRESTORE_SPOTS_LIMIT)
      );
      const snapshot = await getDocs(q);
      const spots = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Spot));
      allSpots.push(...spots);
    }

    return allSpots;
  } catch (error) {
    // Propage l'erreur au hook pour afficher un message à l'utilisateur
    throw error;
  }
};

// Trouve les départements proches d'une position GPS
// Mapping simplifié : on utilise les bornes géographiques des départements
const getNearbyDepartments = (lat: number, lon: number): string[] => {
  // Liste de tous les départements avec leurs centres approximatifs
  const DEPT_CENTERS: [string, number, number][] = [
    ['01',46.2,5.6],['02',49.5,3.6],['03',46.4,3.2],['04',44.1,6.2],['05',44.6,6.3],
    ['06',43.9,7.2],['07',44.7,4.6],['08',49.6,4.6],['09',42.9,1.5],['10',48.3,4.1],
    ['11',43.2,2.4],['12',44.3,2.6],['13',43.5,5.1],['14',49.1,-0.4],['15',45.0,2.7],
    ['16',45.7,0.2],['17',45.9,-0.8],['18',47.1,2.4],['19',45.3,1.8],['2A',41.9,9.0],
    ['2B',42.4,9.2],['21',47.3,4.8],['22',48.5,-3.0],['23',46.1,2.1],['24',45.1,0.7],
    ['25',47.2,6.4],['26',44.7,5.2],['27',49.1,1.2],['28',48.3,1.3],['29',48.4,-4.2],
    ['30',44.0,4.2],['31',43.6,1.4],['32',43.7,0.6],['33',44.8,-0.6],['34',43.6,3.7],
    ['35',48.1,-1.7],['36',46.8,1.6],['37',47.3,0.7],['38',45.3,5.6],['39',46.7,5.7],
    ['40',43.9,-0.8],['41',47.6,1.3],['42',45.7,4.2],['43',45.1,3.7],['44',47.3,-1.6],
    ['45',47.9,2.0],['46',44.6,1.6],['47',44.3,0.5],['48',44.5,3.5],['49',47.5,-0.5],
    ['50',48.9,-1.3],['51',49.0,3.9],['52',48.1,5.3],['53',48.1,-0.8],['54',48.7,6.2],
    ['55',49.0,5.4],['56',47.8,-2.8],['57',49.0,6.7],['58',47.1,3.5],['59',50.4,3.1],
    ['60',49.4,2.5],['61',48.6,0.1],['62',50.5,2.3],['63',45.7,3.1],['64',43.3,-0.8],
    ['65',43.1,0.1],['66',42.6,2.5],['67',48.6,7.5],['68',47.9,7.2],['69',45.8,4.8],
    ['70',47.6,6.2],['71',46.6,4.4],['72',48.0,0.2],['73',45.5,6.4],['74',46.0,6.3],
    ['75',48.9,2.3],['76',49.6,1.1],['77',48.6,2.9],['78',48.8,1.9],['79',46.5,-0.3],
    ['80',49.9,2.3],['81',43.8,2.2],['82',44.0,1.3],['83',43.5,6.3],['84',44.0,5.1],
    ['85',46.7,-1.4],['86',46.6,0.5],['87',45.8,1.3],['88',48.2,6.5],['89',47.8,3.6],
    ['90',47.6,6.9],['91',48.5,2.2],['92',48.8,2.2],['93',48.9,2.5],['94',48.8,2.5],
    ['95',49.1,2.2],['971',16.2,-61.5],['972',14.6,-61.0],['973',4.0,-53.0],
    ['974',-21.1,55.5],['976',-12.8,45.2],
  ];

  // Calcule la distance à chaque département et prend les 8 plus proches
  const withDist = DEPT_CENTERS.map(([code, dLat, dLon]) => ({
    code,
    dist: Math.sqrt(Math.pow(lat - dLat, 2) + Math.pow(lon - dLon, 2)),
  }));

  withDist.sort((a, b) => a.dist - b.dist);
  return withDist.slice(0, NEARBY_DEPARTMENTS_COUNT).map(d => d.code);
};

// Récupère un spot par son ID
export const getSpotById = async (spotId: string): Promise<Spot | null> => {
  const docRef = doc(db, SPOTS_COLLECTION, spotId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Spot;
};

// Ajoute un nouveau spot (ajouté par un utilisateur)
export const addSpot = async (spot: Omit<Spot, 'id' | 'createdAt' | 'updatedAt' | 'signalements' | 'valide'>): Promise<string> => {
  const docRef = await addDoc(collection(db, SPOTS_COLLECTION), {
    ...spot,
    valide: true, // On valide automatiquement pour l'instant
    signalements: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Signale un spot (erreur, fermé, etc.)
export const reportSpot = async (spotId: string) => {
  const docRef = doc(db, SPOTS_COLLECTION, spotId);
  await updateDoc(docRef, {
    signalements: increment(1),
    updatedAt: Timestamp.now(),
  });
};

// Ajoute/retire un spot des favoris d'un utilisateur
export const toggleFavorite = async (userId: string, spotId: string, isFavorite: boolean) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    favoris: isFavorite ? arrayRemove(spotId) : arrayUnion(spotId),
  });
};

// Récupère les favoris d'un utilisateur
export const getUserFavorites = async (userId: string): Promise<string[]> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return [];
  return userSnap.data().favoris ?? [];
};

// Filtre les spots par distance (côté client — simple mais efficace)
export const filterSpotsByDistance = (
  spots: Spot[],
  center: Coords,
  radiusKm: number
): Spot[] => {
  return spots.filter(spot => {
    const distance = getDistanceKm(
      center.latitude,
      center.longitude,
      spot.latitude,
      spot.longitude
    );
    return distance <= radiusKm;
  });
};

// Calcule la distance entre 2 points GPS (formule de Haversine)
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number) => deg * (Math.PI / 180);
