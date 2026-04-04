// Écran détail sport générique — utilisé par tous les sports
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { Spot, SportConfig } from '../types';
import { PhotoCarousel } from './PhotoCarousel';
import { AccessBadge } from './AccessBadge';
import { auth } from '../services/firebase';

interface SportDetailScreenProps {
  spot: Spot;
  onBack: () => void;
  config: SportConfig;
}

export const SportDetailScreen: React.FC<SportDetailScreenProps> = ({ spot, onBack, config }) => {
  const handleNavigate = async () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${spot.latitude},${spot.longitude}`,
      android: `google.navigation:q=${spot.latitude},${spot.longitude}`,
    });
    try {
      if (url) await Linking.openURL(url);
    } catch { Alert.alert('Erreur', 'Navigation indisponible'); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: config.color }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerEmoji}>{config.emoji}</Text>
          <Text style={styles.headerTitle}>{spot.nom}</Text>
        </View>

        <View style={styles.photosSection}>
          <PhotoCarousel photos={spot.photos} sportEmoji={config.emoji} sportColor={config.color} />
        </View>

        <View style={styles.section}>
          <View style={styles.nameRow}>
            <Text style={styles.spotName}>{spot.nom}</Text>
            <AccessBadge acces={spot.acces} prixEstime={spot.prixEstime} />
          </View>
          <Text style={styles.address}>📍 {spot.adresse}, {spot.ville} {spot.codePostal}</Text>
        </View>

        {spot.equipements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Équipements</Text>
            <View style={styles.equipements}>
              {spot.equipements.map((equip, index) => (
                <View key={index} style={styles.equipBadge}>
                  <Text style={styles.equipText}>{equip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {spot.details && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Infos {config.name}</Text>
            {Object.entries(spot.details).map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{key}</Text>
                <Text style={styles.detailValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: config.color }]} onPress={handleNavigate} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>🧭 Y aller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonOutline]} onPress={async () => {
              try {
                const { pickImage, uploadSpotPhoto } = await import('../services/storage');
                const uri = await pickImage();
                if (uri) {
                  const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
                  const { db } = await import('../services/firebase');
                  const photoUrl = await uploadSpotPhoto(uri, spot.id);
                  await updateDoc(doc(db, 'spots', spot.id), { photos: arrayUnion(photoUrl) });
                  Alert.alert('Photo ajoutée', 'Merci pour ta contribution !');
                }
              } catch {
                Alert.alert('Erreur', 'Impossible d\'ajouter la photo.');
              }
            }} activeOpacity={0.8}>
            <Text style={[styles.actionButtonText, { color: Colors.text }]}>📸 Ajouter une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => {
              Alert.alert(
                'Signaler une erreur',
                'Ce terrain contient des informations incorrectes ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Signaler', style: 'destructive', onPress: async () => {
                    try {
                      const { reportSpot } = await import('../services/spots');
                      await reportSpot(spot.id);
                      Alert.alert('Merci', 'Ton signalement a été pris en compte.');
                    } catch {
                      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
                    }
                  }},
                ]
              );
            }} activeOpacity={0.8}>
            <Text style={[styles.actionButtonText, { color: Colors.error }]}>⚠️ Signaler une erreur</Text>
          </TouchableOpacity>
          {auth.currentUser && spot.ajoutePar === auth.currentUser.uid && (
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonDelete]} onPress={() => {
                Alert.alert(
                  'Supprimer ce spot',
                  'Cette action est irréversible. Le spot sera supprimé définitivement.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: async () => {
                      try {
                        const { doc, deleteDoc } = await import('firebase/firestore');
                        const { db } = await import('../services/firebase');
                        await deleteDoc(doc(db, 'spots', spot.id));
                        Alert.alert('Spot supprimé', 'Le spot a été supprimé.');
                        onBack();
                      } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer le spot.');
                      }
                    }},
                  ]
                );
              }} activeOpacity={0.8}>
              <Text style={[styles.actionButtonText, { color: Colors.error }]}>🗑️ Supprimer ce spot</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { marginBottom: 16 },
  backText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.md, color: '#FFFFFF' },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontFamily: 'BarlowCondensed_700Bold', fontSize: FontSizes.xxl, color: '#FFFFFF' },
  photosSection: { marginTop: 20 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  spotName: { fontFamily: 'BarlowCondensed_700Bold', fontSize: FontSizes.xl, color: Colors.text, flex: 1, marginRight: 12 },
  address: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textSecondary },
  sectionTitle: { fontFamily: 'BarlowCondensed_600SemiBold', fontSize: FontSizes.lg, color: Colors.text, marginBottom: 12 },
  equipements: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipBadge: { backgroundColor: Colors.backgroundElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  equipText: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textSecondary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.md, color: Colors.textSecondary },
  detailValue: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.md, color: Colors.text },
  actions: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  actionButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionButtonDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)' },
  actionButtonDelete: { backgroundColor: 'rgba(244,67,54,0.1)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.5)' },
  actionButtonText: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.md, color: '#FFFFFF' },
});
