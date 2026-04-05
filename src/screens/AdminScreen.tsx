// Écran Admin — modération complète (spots, commentaires, utilisateurs)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { Spot, Comment } from '../types';

interface AdminScreenProps {
  onBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'spots' | 'comments' | 'stats'>('spots');
  const [flaggedSpots, setFlaggedSpots] = useState<Spot[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<(Comment & { spotId: string; spotNom: string })[]>([]);
  const [stats, setStats] = useState({ spots: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Spots signalés (signalements > 0, triés par nombre décroissant)
      const spotsQuery = query(
        collection(db, 'spots'),
        where('signalements', '>', 0),
        orderBy('signalements', 'desc'),
        limit(50)
      );
      const spotsSnap = await getDocs(spotsQuery);
      setFlaggedSpots(spotsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Spot)));

      // Commentaires signalés — on parcourt les spots signalés pour trouver leurs commentaires
      const allFlaggedComments: (Comment & { spotId: string; spotNom: string })[] = [];

      // On récupère les commentaires signalés depuis tous les spots (limité aux 20 premiers spots)
      const allSpotsSnap = await getDocs(query(collection(db, 'spots'), limit(100)));
      for (const spotDoc of allSpotsSnap.docs) {
        const commentsQuery = query(
          collection(db, 'spots', spotDoc.id, 'comments'),
          where('signalements', '>', 0)
        );
        const commentsSnap = await getDocs(commentsQuery);
        commentsSnap.docs.forEach(c => {
          allFlaggedComments.push({
            id: c.id,
            ...c.data(),
            spotId: spotDoc.id,
            spotNom: spotDoc.data().nom ?? 'Spot inconnu',
          } as Comment & { spotId: string; spotNom: string });
        });
      }
      allFlaggedComments.sort((a, b) => b.signalements - a.signalements);
      setFlaggedComments(allFlaggedComments);

      // Stats globales
      const spotsCount = await getCountFromServer(collection(db, 'spots'));
      const usersCount = await getCountFromServer(collection(db, 'users'));
      setStats({
        spots: spotsCount.data().count,
        users: usersCount.data().count,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = (spot: Spot) => {
    Alert.alert('Supprimer ce spot', `"${spot.nom}" sera supprimé définitivement.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'spots', spot.id));
          setFlaggedSpots(prev => prev.filter(s => s.id !== spot.id));
          Alert.alert('Supprimé', 'Le spot a été supprimé.');
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer le spot.');
        }
      }},
    ]);
  };

  const handleDeleteComment = (comment: Comment & { spotId: string }) => {
    Alert.alert('Supprimer ce commentaire', 'Le commentaire sera supprimé définitivement.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'spots', comment.spotId, 'comments', comment.id));
          setFlaggedComments(prev => prev.filter(c => c.id !== comment.id));
          Alert.alert('Supprimé', 'Le commentaire a été supprimé.');
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer le commentaire.');
        }
      }},
    ]);
  };

  const handleDeleteUser = () => {
    Alert.prompt(
      'Supprimer un utilisateur',
      'Entre l\'UID de l\'utilisateur à supprimer (visible dans Firebase Console → Authentication) :',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async (uid: string | undefined) => {
          if (!uid?.trim()) return;
          try {
            // Supprime les spots de l'utilisateur
            const userSpotsQuery = query(collection(db, 'spots'), where('ajoutePar', '==', uid.trim()));
            const userSpotsSnap = await getDocs(userSpotsQuery);
            const batch = writeBatch(db);
            userSpotsSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();

            // Supprime le profil
            await deleteDoc(doc(db, 'users', uid.trim()));

            Alert.alert('Supprimé', `Profil et ${userSpotsSnap.size} spots supprimés. Le compte Auth doit être supprimé manuellement dans Firebase Console.`);
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer les données de l\'utilisateur.');
          }
        }},
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Administration</Text>
        </View>

        {/* Onglets */}
        <View style={styles.tabs}>
          {(['spots', 'comments', 'stats'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'spots' ? `Spots (${flaggedSpots.length})` :
                 t === 'comments' ? `Commentaires (${flaggedComments.length})` :
                 'Stats'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : tab === 'spots' ? (
          // Spots signalés
          <View style={styles.section}>
            {flaggedSpots.length === 0 ? (
              <Text style={styles.emptyText}>Aucun spot signalé</Text>
            ) : (
              flaggedSpots.map(spot => (
                <View key={spot.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{spot.nom}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{spot.signalements} signalement{spot.signalements > 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>📍 {spot.ville} · {spot.sport}</Text>
                  <Text style={styles.cardMeta}>Ajouté par : {spot.ajoutePar ?? 'gouvernement'}</Text>
                  {(spot as Spot & { signalementsDetails?: { raison: string }[] }).signalementsDetails?.map((s, i) => (
                    <Text key={i} style={styles.commentPreview}>💬 {s.raison}</Text>
                  ))}
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSpot(spot)}>
                    <Text style={styles.deleteButtonText}>Supprimer ce spot</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : tab === 'comments' ? (
          // Commentaires signalés
          <View style={styles.section}>
            {flaggedComments.length === 0 ? (
              <Text style={styles.emptyText}>Aucun commentaire signalé</Text>
            ) : (
              flaggedComments.map(comment => (
                <View key={comment.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{comment.auteurNom}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{comment.signalements} signalement{comment.signalements > 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>Sur : {comment.spotNom}</Text>
                  <Text style={styles.commentPreview} numberOfLines={3}>{comment.texte}</Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteComment(comment)}>
                    <Text style={styles.deleteButtonText}>Supprimer ce commentaire</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          // Stats
          <View style={styles.section}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.spots.toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLabel}>Spots au total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.users.toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLabel}>Utilisateurs inscrits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{flaggedSpots.length}</Text>
              <Text style={styles.statLabel}>Spots signalés</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{flaggedComments.length}</Text>
              <Text style={styles.statLabel}>Commentaires signalés</Text>
            </View>

            <TouchableOpacity style={styles.dangerAction} onPress={handleDeleteUser}>
              <Text style={styles.dangerActionText}>Supprimer un utilisateur (par UID)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rafraîchir */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.refreshText}>Rafraîchir les données</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.md, color: Colors.accent },
  title: { fontFamily: 'BarlowCondensed_700Bold', fontSize: FontSizes.xxxl, color: Colors.text, marginTop: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.backgroundSecondary, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.xs, color: Colors.textMuted },
  tabTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.md, color: Colors.text, flex: 1, marginRight: 8 },
  badge: { backgroundColor: Colors.error + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.xs, color: Colors.error },
  cardMeta: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 4 },
  commentPreview: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.text, marginTop: 8, marginBottom: 8 },
  deleteButton: { marginTop: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  deleteButtonText: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.sm, color: Colors.error },
  statCard: { backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 20, marginBottom: 12, alignItems: 'center' },
  statNumber: { fontFamily: 'BarlowCondensed_700Bold', fontSize: FontSizes.xxxl, color: Colors.text },
  statLabel: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
  dangerAction: { marginTop: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.error + '50', backgroundColor: Colors.error + '10', alignItems: 'center' },
  dangerActionText: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.md, color: Colors.error },
  refreshButton: { marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  refreshText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.md, color: Colors.textSecondary },
});
