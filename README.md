# Fieldz 🗺️⚽🏀🎾

**Carte interactive des spots sportifs en France** — gratuits et payants.

Trouve ton terrain de foot, basket, tennis, skate, et bien plus autour de toi.

---

## Stack technique

- React Native + Expo SDK 55
- TypeScript
- Google Maps (`react-native-maps`)
- Firebase (Auth + Firestore + Storage)
- React Navigation (bottom tabs)

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npx expo start
```

Scanner le QR code avec **Expo Go** sur ton téléphone.

## Structure du projet

```
src/
├── sports/           ← UN DOSSIER PAR SPORT (pour bosser sans conflit)
│   ├── _template/    ← Template pour ajouter un sport
│   ├── football/
│   ├── basket/
│   ├── tennis/
│   └── ...
├── screens/          ← Écrans principaux (carte, profil, etc.)
├── components/       ← Composants partagés
├── services/         ← Firebase, API, stockage
├── hooks/            ← Logique réutilisable
├── constants/        ← Couleurs, typo, config
└── types/            ← Types TypeScript
```

---

## Workflow Git

### Branches
- `main` : code stable et validé
- `nasserdine` : branche de développement principale
- `[prenom-ami]` : branche du collaborateur

### Ajouter un nouveau sport

1. Copier le dossier `src/sports/_template/`
2. Renommer en `src/sports/[nom-sport]/`
3. Modifier `sport.config.ts` avec les infos du sport
4. Renommer les composants (`SportScreen` → `MonSportScreen`, etc.)
5. Ajouter l'import dans `src/constants/sports.ts`
6. Ajouter l'import dans `App.tsx` (section `SPORT_SCREENS`)
7. Commit sur sa branche personnelle

### Règles pour éviter les conflits

- **Ne JAMAIS modifier les fichiers d'un autre sport**
- Les fichiers partagés (navigation, firebase, types) → créer une PR
- Un sport = un dossier = une responsabilité
- Toujours pull avant de commencer à bosser

---

## Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

---

## Sports disponibles

| Sport | Emoji | Couleur | Payants |
|-------|-------|---------|---------|
| Football | ⚽ | Vert | Oui |
| Basket | 🏀 | Orange | Oui |
| Tennis | 🎾 | Jaune | Oui |
| Pétanque | 🎳 | Gris | Non |
| Skate | 🛹 | Violet | Non |
| Badminton | 🏸 | Cyan | Oui |
| Volley | 🏐 | Rouge | Oui |
| Ping-pong | 🏓 | Rose | Non |
| Running | 🏃 | Bleu | Non |
| Fitness | 💪 | Orange foncé | Non |
