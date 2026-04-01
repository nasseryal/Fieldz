// ============================================================
// TEMPLATE — Config d'un sport
// ============================================================
// POUR AJOUTER UN NOUVEAU SPORT :
// 1. Copie tout le dossier _template/ dans src/sports/[nom-sport]/
// 2. Renomme ce fichier en [nom-sport].config.ts
// 3. Change les valeurs ci-dessous
// 4. Ajoute l'import dans src/constants/sports.ts
// ============================================================

import { SportConfig } from '../../types';

export const sportConfig: SportConfig = {
  id: 'REMPLACER',           // ex: 'football' — en minuscules, sans accent
  name: 'REMPLACER',         // ex: 'Football' — nom affiché dans l'app
  emoji: '🏅',               // ex: '⚽' — un seul emoji
  color: '#FFFFFF',          // ex: '#4CAF50' — couleur principale du sport
  colorDark: '#CCCCCC',      // ex: '#388E3C' — version foncée (pour les dégradés)
  icon: 'REMPLACER',         // ex: 'football' — nom d'icône
  dataGovCategory: 'REMPLACER', // ex: 'Football' — catégorie dans l'API data.gouv.fr
  allowsPaid: false,          // true si des spots payants existent pour ce sport
};
