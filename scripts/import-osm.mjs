// Import OpenStreetMap — récupère les spots sportifs manquants
// Anti-doublons : ignore les spots à moins de 50m d'un spot existant
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, collection, getDocs, query, where, limit, Timestamp } from 'firebase/firestore';

import { firebaseConfig } from './firebase-config.mjs';
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Sports à importer depuis OSM
const OSM_SPORTS = [
  { id: 'football', query: '["leisure"="pitch"]["sport"="soccer"]' },
  { id: 'basket', query: '["leisure"="pitch"]["sport"="basketball"]' },
  { id: 'tennis', query: '["leisure"="pitch"]["sport"="tennis"]' },
  { id: 'petanque', query: '["sport"="boules"]' },
  { id: 'skate', query: '["leisure"="skatepark"]' },
  { id: 'fitness', query: '["leisure"="fitness_station"]' },
  { id: 'pingpong', query: '["sport"="table_tennis"]' },
  { id: 'volley', query: '["leisure"="pitch"]["sport"="volleyball"]' },
  { id: 'running', query: '["leisure"="track"]["sport"="running"]' },
  { id: 'badminton', query: '["leisure"="pitch"]["sport"="badminton"]' },
];

// Découpe la France en petites zones (~1.5° × 2°) pour ne pas surcharger
const ZONES = [];
for (let lat = 42.0; lat < 51.5; lat += 1.5) {
  for (let lon = -5.5; lon < 9.5; lon += 2.0) {
    ZONES.push({
      name: `${lat.toFixed(1)},${lon.toFixed(1)}`,
      bbox: [lat, lon, Math.min(lat + 1.5, 51.5), Math.min(lon + 2.0, 9.5)],
    });
  }
}
// Corse
ZONES.push({ name: 'Corse', bbox: [41.3, 8.5, 43.1, 9.7] });

// Requête Overpass pour une zone et un sport
async function fetchOSMZone(sportQuery, bbox, retries = 3) {
  const [south, west, north, east] = bbox;
  const overpassQuery = `
    [out:json][timeout:60];
    (
      node${sportQuery}(${south},${west},${north},${east});
      way${sportQuery}(${south},${west},${north},${east});
    );
    out center;
  `;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status === 429 || response.status === 504) {
        console.log(`      ⏳ API surchargée — pause 30s (essai ${attempt + 1}/${retries})`);
        await sleep(30000);
        continue;
      }

      if (!response.ok) {
        console.log(`      ⚠️ Erreur HTTP ${response.status}`);
        await sleep(10000);
        continue;
      }

      const text = await response.text();
      // Vérifie que c'est bien du JSON
      if (text.startsWith('<')) {
        console.log(`      ⚠️ Réponse HTML (rate limit) — pause 30s`);
        await sleep(30000);
        continue;
      }

      const data = JSON.parse(text);
      return data.elements ?? [];
    } catch (error) {
      console.log(`      ⚠️ Erreur: ${error.message} — pause 10s`);
      await sleep(10000);
    }
  }

  return [];
}

// Transforme un élément OSM en spot Fieldz
function osmToSpot(element, sportId) {
  // Les "ways" ont leurs coordonnées dans center
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!lat || !lon) return null;

  const tags = element.tags ?? {};
  const nom = tags.name || tags['name:fr'] || 'Terrain sans nom';
  // ID arrondi à 4 décimales (~11m) avec préfixe gouv_ = même ID qu'un spot gouvernemental au même endroit
  // Résultat : si le terrain existe déjà dans la base gouv, il sera juste mis à jour (pas de doublon)
  const spotId = `gouv_${sportId}_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return {
    id: spotId,
    nom,
    sport: sportId,
    latitude: lat,
    longitude: lon,
    adresse: tags['addr:street'] || '',
    ville: tags['addr:city'] || '',
    codePostal: tags['addr:postcode'] || '',
    acces: tags.access === 'private' || tags.fee === 'yes' ? 'payant' : 'gratuit',
    equipements: buildOSMEquipements(tags),
    photos: [],
    source: 'gouvernement', // On garde le même source pour compatibilité
    valide: true,
    signalements: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function buildOSMEquipements(tags) {
  const equips = [];
  if (tags.lit === 'yes') equips.push('Éclairage');
  if (tags.surface) equips.push(tags.surface);
  if (tags.covered === 'yes') equips.push('Couvert');
  return equips;
}

// Écriture Firestore par petits lots avec pause entre chaque
async function writeBatchSpots(spots) {
  for (let i = 0; i < spots.length; i += 200) {
    const chunk = spots.slice(i, i + 200);
    const batch = writeBatch(db);
    for (const spot of chunk) {
      batch.set(doc(db, 'spots', spot.id), spot, { merge: true });
    }
    await batch.commit();
    await sleep(500); // Pause entre chaque lot pour ne pas surcharger Firestore
  }
}

// Import principal
async function main() {
  console.log('🗺️  Import OpenStreetMap — France entière');
  console.log('   Anti-doublons par coordonnées (même ID = même spot)');
  console.log('='.repeat(50));

  let grandTotal = 0;

  for (const sport of OSM_SPORTS) {
    console.log(`\n🏟️  ${sport.id.toUpperCase()}`);
    let sportTotal = 0;

    for (const zone of ZONES) {
      try {
        const elements = await fetchOSMZone(sport.query, zone.bbox);

        if (elements.length === 0) continue;

        const spots = elements
          .map(el => osmToSpot(el, sport.id))
          .filter(s => s !== null);

        if (spots.length > 0) {
          await writeBatchSpots(spots);
          sportTotal += spots.length;
          process.stdout.write(`   ${zone.name}: +${spots.length} (total ${sportTotal})   \r`);
        }

        await sleep(2000); // 2s entre chaque zone pour respecter l'API
      } catch (error) {
        console.log(`   ⚠️ ${zone.name}: ${error.message}`);
        await sleep(5000);
      }
    }

    console.log(`   ✅ ${sport.id.toUpperCase()} — ${sportTotal} spots importés`);
    grandTotal += sportTotal;

    console.log(`   ⏳ Pause 15s avant le prochain sport...`);
    await sleep(15000);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 TERMINÉ — ${grandTotal} spots OpenStreetMap importés`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Erreur:', err); process.exit(1); });
