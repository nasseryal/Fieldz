// Types principaux de Fieldz

import { Timestamp } from 'firebase/firestore';

// Un spot sportif (terrain, salle, etc.)
export interface Spot {
  id: string;
  nom: string;
  sport: string; // 'football', 'basket', etc.
  latitude: number;
  longitude: number;
  adresse: string;
  ville: string;
  codePostal: string;
  acces: 'gratuit' | 'payant' | 'mixte';
  prixEstime?: string; // "10€/h" pour les payants
  equipements: string[]; // ['eclairage', 'vestiaires', 'pmr']
  photos: string[];
  source: 'gouvernement' | 'utilisateur';
  valide: boolean;
  ajoutePar?: string;
  signalements: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Champs spécifiques par sport (optionnels)
  details?: Record<string, string | number | boolean>;
}

// Configuration d'un sport
export interface SportConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  dataGovCategory: string;
}

// Utilisateur connecté
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  spotsAjoutes: number;
  sportsExplores: string[];
  favoris: string[];
  createdAt: Timestamp;
}

// Filtre actif sur la carte
export interface MapFilters {
  sport: string | null; // null = tous les sports
  acces: 'tous' | 'gratuit' | 'payant';
}

// Coordonnées GPS
export interface Coords {
  latitude: number;
  longitude: number;
}

