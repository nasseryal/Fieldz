// Liste centrale de tous les sports — c'est ici qu'on ajoute un nouveau sport
import { SportConfig } from '../types';

// Import des configs de chaque sport
import { sportConfig as footballConfig } from '../sports/football/football.config';
import { sportConfig as basketConfig } from '../sports/basket/basket.config';
import { sportConfig as tennisConfig } from '../sports/tennis/tennis.config';
import { sportConfig as petanqueConfig } from '../sports/petanque/petanque.config';
import { sportConfig as skateConfig } from '../sports/skate/skate.config';
import { sportConfig as badmintonConfig } from '../sports/badminton/badminton.config';
import { sportConfig as volleyConfig } from '../sports/volley/volley.config';
import { sportConfig as pingpongConfig } from '../sports/pingpong/pingpong.config';
import { sportConfig as runningConfig } from '../sports/running/running.config';
import { sportConfig as fitnessConfig } from '../sports/fitness/fitness.config';

// Tous les sports disponibles dans l'app
export const ALL_SPORTS: SportConfig[] = [
  footballConfig,
  basketConfig,
  tennisConfig,
  petanqueConfig,
  skateConfig,
  badmintonConfig,
  volleyConfig,
  pingpongConfig,
  runningConfig,
  fitnessConfig,
];

// Accès rapide par ID — par exemple getSportById('football')
export const getSportById = (id: string): SportConfig | undefined => {
  return ALL_SPORTS.find(sport => sport.id === id);
};
