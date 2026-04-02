# CLAUDE.md — Règles spécifiques Fieldz

Les règles universelles (actions interdites, local ≠ distant, preuve obligatoire) sont dans `~/.claude/CLAUDE.md`.

---

## FIREBASE — PIÈGES CONNUS

### Clé API Web vs iOS
- Le SDK JavaScript Firebase (`firebase/auth`, `firebase/firestore`) utilise la **clé API Web**, PAS la clé iOS
- La clé iOS est UNIQUEMENT pour `GoogleService-Info.plist` (modules natifs)
- `EXPO_PUBLIC_FIREBASE_API_KEY` doit être la clé Web (Firebase Console → Project Settings → Web apps → apiKey)

### Apple Sign In + Firebase = nonce obligatoire
- Générer un nonce aléatoire, le hasher en SHA256 avec `expo-crypto`
- Passer le hash à `signInAsync`, le raw à `OAuthProvider.credential`
- Sans nonce : échec silencieux, aucune erreur claire affichée

### Rules : local ≠ déployé
- Les fichiers `firestore.rules` et `storage.rules` ne se déploient PAS automatiquement
- Firestore rules doivent commencer par `service cloud.firestore` (PAS `service firebase.storage`)
- Storage rules doivent commencer par `service firebase.storage`
- Les rules "test mode" (30 jours) expirent et reviennent à tout-bloquer sans prévenir

### Commandes de vérification
- Firestore rules : `curl -s "https://firestore.googleapis.com/v1/projects/fieldz-ac541/databases/%28default%29/documents/spots?pageSize=1&key=API_KEY"`
- EAS variables : `npx eas env:list --environment production`
- Clé API valide : `curl -s -o /dev/null -w "%{http_code}" "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=CLE"`

---

## STACK TECHNIQUE
- React Native + Expo SDK 54 + TypeScript
- Firebase Auth (email + Apple Sign In) + Firestore + Storage
- Google Maps via react-native-maps (EAS build only)
- Sentry crash reporting
- EAS Build pour iOS production
