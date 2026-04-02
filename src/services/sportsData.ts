// Service API gouvernementale — récupère les équipements sportifs de data.gouv.fr
// C'est comme un annuaire officiel de tous les terrains de sport en France
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Spot } from '../types';
import { ALL_SPORTS } from '../constants/sports';

const API_BASE = 'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records';

// Structure réelle d'un enregistrement de l'API
interface GouvRecord {
  equip_nom: string;
  inst_nom: string;
  inst_adresse: string;
  new_name: string; // ville
  inst_cp: string;
  equip_coordonnees: { lon: number; lat: number } | null;
  aps_name: string[];
  equip_acc_libre: string;
  equip_eclair: string;
  equip_sol: string;
  equip_nature: string;
  equip_douche: string;
  equip_vest_sport: number;
}

// Récupère les spots depuis l'API pour un sport donné
// Récupère les spots par pages de 100 (limite de l'API)
export const fetchSpotsFromGouv = async (
  sportCategory: string,
  totalWanted: number = 500
): Promise<Partial<Spot>[]> => {
  const allSpots: Partial<Spot>[] = [];

  try {
    const whereClause = `search(aps_name,"${sportCategory}") AND equip_coordonnees is not null`;
    const pages = Math.ceil(totalWanted / 100); // 500 voulus = 5 pages de 100

    for (let page = 0; page < pages; page++) {
      const params = new URLSearchParams({
        where: whereClause,
        limit: '100',
        offset: String(page * 100),
      });

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) throw new Error(`API erreur: ${response.status}`);

      const data = await response.json();
      const records: GouvRecord[] = data.results ?? [];

      if (records.length === 0) break; // Plus de résultats

      const spots = records
        .filter((r) => r.equip_coordonnees)
        .map((r) => ({
          nom: r.equip_nom || r.inst_nom || 'Terrain sans nom',
          adresse: r.inst_adresse || '',
          ville: r.new_name || '',
          codePostal: r.inst_cp || '',
          latitude: r.equip_coordonnees!.lat,
          longitude: r.equip_coordonnees!.lon,
          acces: r.equip_acc_libre === 'true' ? 'gratuit' as const : 'payant' as const,
          equipements: buildEquipements(r),
          source: 'gouvernement' as const,
        }));

      allSpots.push(...spots);
    }
  } catch (error) {
    // Retourne ce qu'on a récupéré jusqu'ici (peut être partiel)
    return allSpots;
  }

  return allSpots;
};

// Construit la liste des équipements
const buildEquipements = (record: GouvRecord): string[] => {
  const equips: string[] = [];
  if (record.equip_eclair === 'true') equips.push('Éclairage');
  if (record.equip_sol) equips.push(record.equip_sol);
  if (record.equip_nature) equips.push(record.equip_nature);
  if (record.equip_douche === 'true') equips.push('Douches');
  if (record.equip_vest_sport > 0) equips.push('Vestiaires');
  return equips;
};

// Importe les spots par lots de 450 (Firestore limite à 500 par batch)
export const importSpotsToFirestore = async (
  sportId: string,
  spots: Partial<Spot>[]
): Promise<number> => {
  let count = 0;

  // Découpe en paquets de 450 (Firestore limite à 500 par batch)
  for (let i = 0; i < spots.length; i += 450) {
    const chunk = spots.slice(i, i + 450);
    const batch = writeBatch(db);

    for (const spot of chunk) {
      const spotId = `gouv_${sportId}_${spot.latitude?.toFixed(5)}_${spot.longitude?.toFixed(5)}`;
      const ref = doc(db, 'spots', spotId);

      batch.set(ref, {
        ...spot,
        id: spotId,
        sport: sportId,
        photos: [],
        valide: true,
        signalements: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });

      count++;
    }

    await batch.commit();
  }

  return count;
};

// IMPORT MASSIF — récupère 500 spots par sport (toute la France)
export const importAllSports = async (
  onProgress: (sport: string, count: number) => void
): Promise<number> => {
  let totalCount = 0;

  for (const sport of ALL_SPORTS) {
    try {
      const spots = await fetchSpotsFromGouv(sport.dataGovCategory, 500);

      if (spots.length > 0) {
        const count = await importSpotsToFirestore(sport.id, spots);
        totalCount += count;
        onProgress(sport.name, count);
      } else {
        onProgress(sport.name, 0);
      }
    } catch (error) {
      // Erreur import — on continue avec le sport suivant
      onProgress(sport.name, -1);
    }
  }

  return totalCount;
};
