// Écran d'ajout de spot — wizard en 3 étapes
// C'est comme un formulaire guidé pour ajouter un terrain manquant
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { ALL_SPORTS } from '../constants/sports';
import { Spot } from '../types';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { addSpot } from '../services/spots';
import { uploadSpotPhoto } from '../services/storage';
import { pickImage, takePhoto } from '../services/storage';

export const AddSpotScreen: React.FC = () => {
  const { coords } = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1, 2 ou 3
  const [loading, setLoading] = useState(false);

  // Données du formulaire — se met à jour quand le GPS change
  const [location, setLocation] = useState({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  React.useEffect(() => {
    setLocation({ latitude: coords.latitude, longitude: coords.longitude });
  }, [coords.latitude, coords.longitude]);
  const [sportId, setSportId] = useState('');
  const [nom, setNom] = useState('');
  const [acces, setAcces] = useState<'gratuit' | 'payant' | 'mixte'>('gratuit');
  const [prix, setPrix] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Étape suivante
  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!sportId) {
        Alert.alert('Oups', 'Choisis un sport');
        return;
      }
      if (!nom || nom.length < 3) {
        Alert.alert('Oups', 'Donne un nom au spot (3 caractères minimum)');
        return;
      }
      setStep(3);
    }
  };

  // Soumettre le spot
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Tu dois être connecté pour ajouter un spot.');
      return;
    }

    try {
      setLoading(true);

      // Reverse geocoding pour remplir adresse/ville/codePostal automatiquement
      let spotVille = '';
      let spotAdresse = '';
      let spotCodePostal = '';
      try {
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
          { headers: { 'User-Agent': 'Fieldz-App/1.0 (fieldz.app.contact@gmail.com)' } }
        );
        const geoData = await geoResp.json();
        if (geoData.address) {
          spotVille = geoData.address.city || geoData.address.town || geoData.address.village || '';
          spotAdresse = geoData.address.road || '';
          spotCodePostal = geoData.address.postcode || '';
        }
      } catch {
        // Pas grave si le reverse geocoding échoue
      }

      const spotData: Omit<Spot, 'id' | 'createdAt' | 'updatedAt' | 'signalements' | 'valide'> = {
        nom,
        sport: sportId,
        latitude: location.latitude,
        longitude: location.longitude,
        adresse: spotAdresse,
        ville: spotVille,
        codePostal: spotCodePostal,
        acces,
        equipements: [],
        photos: [],
        source: 'utilisateur',
        ajoutePar: user.uid,
      };
      if (acces === 'payant' && prix) {
        spotData.prixEstime = prix;
      }

      const spotId = await addSpot(spotData);

      // Upload la photo et lie l'URL au spot
      if (photoUri) {
        const photoUrl = await uploadSpotPhoto(photoUri, spotId);
        const { doc: firestoreDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        await updateDoc(firestoreDoc(db, 'spots', spotId), { photos: arrayUnion(photoUrl) });
      }

      Alert.alert('Bravo ! 🎉', 'Ton spot a été ajouté avec succès');
      // Reset le formulaire
      setStep(1);
      setNom('');
      setSportId('');
      setPhotoUri(null);
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'ajouter le spot");
      // Erreur gérée par l'Alert au-dessus
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter un spot</Text>
          <Text style={styles.subtitle}>Étape {step} sur 3</Text>

          {/* Barre de progression */}
          <View style={styles.progressBar}>
            {[1, 2, 3].map(s => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && { backgroundColor: Colors.accent },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ÉTAPE 1 : Localisation */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📍 Où se trouve le spot ?</Text>
            <Text style={styles.stepDescription}>
              Déplace le marqueur sur la carte pour indiquer l'emplacement exact.
            </Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <Text style={{ fontSize: 40 }}>📍</Text>
                <Text style={styles.mapPlaceholderText}>
                  Position GPS actuelle utilisée
                </Text>
                <Text style={styles.mapPlaceholderCoords}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ÉTAPE 2 : Informations */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🏟️ Infos du spot</Text>

            {/* Sélection du sport */}
            <Text style={styles.label}>Sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sportsRow}>
                {ALL_SPORTS.map(sport => (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportOption,
                      sportId === sport.id && {
                        backgroundColor: sport.color + '30',
                        borderColor: sport.color,
                      },
                    ]}
                    onPress={() => setSportId(sport.id)}
                  >
                    <Text style={styles.sportOptionEmoji}>{sport.emoji}</Text>
                    <Text
                      style={[
                        styles.sportOptionName,
                        sportId === sport.id && { color: sport.color },
                      ]}
                    >
                      {sport.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Nom du spot */}
            <Text style={styles.label}>Nom du spot</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Terrain du Parc Municipal"
              placeholderTextColor={Colors.textMuted}
              value={nom}
              onChangeText={setNom}
              maxLength={100}
            />

            {/* Accès */}
            <Text style={styles.label}>Accès</Text>
            <View style={styles.accessRow}>
              {(['gratuit', 'payant', 'mixte'] as const).map(a => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.accessOption,
                    acces === a && styles.accessOptionActive,
                  ]}
                  onPress={() => setAcces(a)}
                >
                  <Text
                    style={[
                      styles.accessOptionText,
                      acces === a && styles.accessOptionTextActive,
                    ]}
                  >
                    {a === 'gratuit' ? '🆓 Gratuit' : a === 'payant' ? '💰 Payant' : '🔀 Mixte'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prix estimé (si payant) */}
            {acces === 'payant' && (
              <>
                <Text style={styles.label}>Prix estimé</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10€/h"
                  placeholderTextColor={Colors.textMuted}
                  value={prix}
                  onChangeText={setPrix}
                  maxLength={20}
                />
              </>
            )}
          </View>
        )}

        {/* ÉTAPE 3 : Photo */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📸 Ajoute une photo</Text>
            <Text style={styles.stepDescription}>
              Une photo aide les autres sportifs à reconnaître le terrain.
            </Text>

            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderEmoji}>📷</Text>
              </View>
            )}

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={async () => {
                  try {
                    const uri = await takePhoto();
                    if (uri) setPhotoUri(uri);
                  } catch {
                    Alert.alert('Erreur', 'Impossible d\'ouvrir l\'appareil photo.');
                  }
                }}
              >
                <Text style={styles.photoButtonText}>📸 Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, styles.photoButtonOutline]}
                onPress={async () => {
                  try {
                    const uri = await pickImage();
                    if (uri) setPhotoUri(uri);
                  } catch {
                    Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie.');
                  }
                }}
              >
                <Text style={[styles.photoButtonText, { color: Colors.text }]}>
                  🖼️ Depuis la galerie
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Boutons de navigation */}
        <View style={styles.navigation}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={step === 3 ? handleSubmit : handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Publier le spot 🚀' : 'Suivant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien ignorer la photo */}
        {step === 3 && !photoUri && !loading && (
          <TouchableOpacity onPress={handleSubmit} style={styles.skipPhoto} disabled={loading}>
            <Text style={styles.skipPhotoText}>Passer sans photo</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundElevated,
  },
  stepContainer: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xl,
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    gap: 8,
  },
  mapPlaceholderText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  mapPlaceholderCoords: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sportsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  sportOption: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  sportOptionEmoji: {
    fontSize: 24,
  },
  sportOptionName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  accessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accessOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  accessOptionActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  accessOptionText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  accessOptionTextActive: {
    color: Colors.accent,
  },
  photoPreview: {
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  photoPlaceholder: {
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderEmoji: {
    fontSize: 48,
  },
  photoActions: {
    gap: 10,
  },
  photoButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  photoButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photoButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.md,
    color: '#FFFFFF',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  backButtonText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: FontSizes.md,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipPhoto: {
    alignItems: 'center',
    marginTop: 12,
  },
  skipPhotoText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
