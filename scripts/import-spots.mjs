// Script d'import national — découpe par département pour contourner la limite de 10 000
// Usage : node scripts/import-spots.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, Timestamp } from 'firebase/firestore';

import { firebaseConfig } from './firebase-config.mjs';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const API_BASE = 'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records';

const SPORTS = [
  { id: 'football', category: 'Football' },
  { id: 'basket', category: 'Basket-Ball' },
  { id: 'tennis', category: 'Tennis' },
  { id: 'petanque', category: 'Pétanque' },
  { id: 'skate', category: 'Roller' },
  { id: 'badminton', category: 'Badminton' },
  { id: 'volley', category: 'Volley' },
  { id: 'pingpong', category: 'Tennis de table' },
  { id: 'running', category: 'Athlétisme' },
  { id: 'fitness', category: 'Musculation' },
];

// Tous les départements français
const DEPS = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18','19','2A','2B',
  '21','22','23','24','25','26','27','28','29','30',
  '31','32','33','34','35','36','37','38','39','40',
  '41','42','43','44','45','46','47','48','49','50',
  '51','52','53','54','55','56','57','58','59','60',
  '61','62','63','64','65','66','67','68','69','70',
  '71','72','73','74','75','76','77','78','79','80',
  '81','82','83','84','85','86','87','88','89','90',
  '91','92','93','94','95',
  '971','972','973','974','976',
];

// Pause
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Récupère une page de l'API
async function fetchPage(category, depCode, offset) {
  const whereClause = `search(aps_name,"${category}") AND equip_coordonnees is not null AND dep_code="${depCode}"`;
  const params = new URLSearchParams({
    where: whereClause,
    limit: '100',
    offset: String(offset),
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  // Si 403 (rate limit), on attend 30s et on réessaie
  if (response.status === 403) {
    console.log(`      ⏳ Rate limit — pause 30s...`);
    await sleep(30000);
    const retry = await fetch(`${API_BASE}?${params.toString()}`);
    if (!retry.ok) return { records: [], total: 0 };
    const data = await retry.json();
    return { records: data.results ?? [], total: data.total_count ?? 0 };
  }

  if (!response.ok) return { records: [], total: 0 };

  const data = await response.json();
  return { records: data.results ?? [], total: data.total_count ?? 0 };
}

// Transforme un enregistrement en spot
function toSpot(record, sportId) {
  const equips = [];
  if (record.equip_eclair === 'true') equips.push('Éclairage');
  if (record.equip_sol) equips.push(record.equip_sol);
  if (record.equip_nature) equips.push(record.equip_nature);
  if (record.equip_douche === 'true') equips.push('Douches');
  if (record.equip_vest_sport > 0) equips.push('Vestiaires');

  const spotId = `gouv_${sportId}_${record.equip_coordonnees.lat.toFixed(5)}_${record.equip_coordonnees.lon.toFixed(5)}`;

  return {
    id: spotId,
    nom: record.equip_nom || record.inst_nom || 'Terrain sans nom',
    sport: sportId,
    adresse: record.inst_adresse || '',
    ville: record.new_name || '',
    codePostal: record.inst_cp || '',
    latitude: record.equip_coordonnees.lat,
    longitude: record.equip_coordonnees.lon,
    acces: record.equip_acc_libre === 'true' ? 'gratuit' : 'payant',
    equipements: equips,
    photos: [],
    source: 'gouvernement',
    valide: true,
    signalements: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// Écrit par lots dans Firestore
async function writeBatchSpots(spots) {
  for (let i = 0; i < spots.length; i += 450) {
    const chunk = spots.slice(i, i + 450);
    const batch = writeBatch(db);
    for (const spot of chunk) {
      batch.set(doc(db, 'spots', spot.id), spot, { merge: true });
    }
    await batch.commit();
  }
}

// Import principal
async function main() {
  console.log('🚀 Import national Fieldz');
  console.log('='.repeat(50));

  let grandTotal = 0;

  for (const sport of SPORTS) {
    console.log(`\n🏟️  ${sport.id.toUpperCase()}`);
    let sportTotal = 0;

    for (const dep of DEPS) {
      try {
        // Première page pour connaître le total
        const firstPage = await fetchPage(sport.category, dep, 0);
        const total = firstPage.total;

        if (total === 0) continue; // Pas de spots dans ce département

        const allSpots = [];
        let offset = 0;

        while (offset < total) {
          const { records } = offset === 0
            ? firstPage
            : await fetchPage(sport.category, dep, offset);

          if (records.length === 0) break;

          const spots = records
            .filter(r => r.equip_coordonnees)
            .map(r => toSpot(r, sport.id));

          allSpots.push(...spots);
          offset += 100;
          await sleep(150); // Pause entre chaque page
        }

        // Écriture Firestore
        if (allSpots.length > 0) {
          await writeBatchSpots(allSpots);
          sportTotal += allSpots.length;
          process.stdout.write(`   Dép ${dep}: +${allSpots.length} (total ${sportTotal})   \r`);
        }

        await sleep(100); // Pause entre chaque département
      } catch (error) {
        console.log(`   ⚠️ Dép ${dep}: ${error.message}`);
        await sleep(5000);
      }
    }

    console.log(`   ✅ ${sport.id.toUpperCase()} — ${sportTotal} spots importés`);
    grandTotal += sportTotal;

    // Pause de 10s entre chaque sport pour éviter le rate limit
    console.log(`   ⏳ Pause 10s avant le prochain sport...`);
    await sleep(10000);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 TERMINÉ — ${grandTotal} spots importés au total`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
