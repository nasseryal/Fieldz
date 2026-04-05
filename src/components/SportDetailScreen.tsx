// Écran détail sport générique — utilisé par tous les sports
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { Spot, SportConfig, Comment } from '../types';
import { PhotoCarousel } from './PhotoCarousel';
import { AccessBadge } from './AccessBadge';
import { auth } from '../services/firebase';
import { getComments, addComment, deleteComment, reportComment } from '../services/comments';

interface SportDetailScreenProps {
  spot: Spot;
  onBack: () => void;
  config: SportConfig;
}

export const SportDetailScreen: React.FC<SportDetailScreenProps> = ({ spot, onBack, config }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  // Charge les commentaires au montage
  useEffect(() => {
    getComments(spot.id).then(setComments).catch(() => {
      // Pas grave si les commentaires ne chargent pas
    });
  }, [spot.id]);

  const handleAddComment = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Tu dois être connecté pour commenter.');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setLoadingComment(true);
      await addComment(
        spot.id,
        newComment.trim(),
        auth.currentUser.displayName ?? 'Anonyme',
        auth.currentUser.uid
      );
      setNewComment('');
      // Recharge les commentaires
      const updated = await getComments(spot.id);
      setComments(updated);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire.');
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await deleteComment(spot.id, commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer le commentaire.');
        }
      }},
    ]);
  };

  const handleReportComment = (commentId: string) => {
    Alert.alert('Signaler', 'Signaler ce commentaire comme inapproprié ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Signaler', style: 'destructive', onPress: async () => {
        try {
          await reportComment(spot.id, commentId);
          Alert.alert('Merci', 'Ton signalement a été pris en compte.');
        } catch {
          Alert.alert('Erreur', 'Impossible de signaler le commentaire.');
        }
      }},
    ]);
  };

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

        {/* Commentaires communautaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Commentaires</Text>

          {/* Champ de saisie */}
          {auth.currentUser && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajoute un commentaire..."
                placeholderTextColor={Colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                maxLength={500}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSendButton, { backgroundColor: config.color }]}
                onPress={handleAddComment}
                disabled={loadingComment || !newComment.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.commentSendText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Liste des commentaires */}
          {comments.length === 0 ? (
            <Text style={styles.noComments}>Aucun commentaire pour le moment.</Text>
          ) : (
            comments.map(comment => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.auteurNom}</Text>
                  <Text style={styles.commentDate}>
                    {comment.createdAt?.toDate?.().toLocaleDateString('fr-FR') ?? ''}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.texte}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity onPress={() => handleReportComment(comment.id)}>
                    <Text style={styles.commentActionText}>Signaler</Text>
                  </TouchableOpacity>
                  {auth.currentUser && auth.currentUser.uid === comment.auteurUid && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                      <Text style={[styles.commentActionText, { color: Colors.error }]}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

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
              Alert.prompt(
                'Signaler une erreur',
                'Décris le problème (terrain fermé, mauvaise adresse, doublon, etc.) :',
                async (raison: string) => {
                  if (!raison?.trim()) return;
                  try {
                    const { reportSpot } = await import('../services/spots');
                    await reportSpot(spot.id, raison);
                    Alert.alert('Merci', 'Ton signalement a été pris en compte.');
                  } catch {
                    Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
                  }
                },
                'plain-text',
                '',
                'default'
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
  // Commentaires
  commentInputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 80,
  },
  commentSendButton: { paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  commentSendText: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.sm, color: '#FFFFFF' },
  noComments: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  commentCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.sm, color: Colors.text },
  commentDate: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.xs, color: Colors.textMuted },
  commentText: { fontFamily: 'DMSans_400Regular', fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 8 },
  commentActions: { flexDirection: 'row', gap: 16 },
  commentActionText: { fontFamily: 'DMSans_500Medium', fontSize: FontSizes.xs, color: Colors.textMuted },
  // Actions
  actions: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  actionButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionButtonDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)' },
  actionButtonDelete: { backgroundColor: 'rgba(244,67,54,0.1)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.5)' },
  actionButtonText: { fontFamily: 'DMSans_600SemiBold', fontSize: FontSizes.md, color: '#FFFFFF' },
});
