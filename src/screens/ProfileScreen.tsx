// Écran Profil — infos utilisateur, stats, déconnexion, suppression compte
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { FontSizes } from '../constants/typography';
import { useAuth } from '../hooks/useAuth';
import { signOut, deleteAccount } from '../services/auth';
import { FieldzLogo } from '../components/FieldzLogo';
import Constants from 'expo-constants';
import { AdminScreen } from './AdminScreen';

// Email admin — dans une variable d'env pour ne pas être en dur
const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? '';

export const ProfileScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showAdmin, setShowAdmin] = useState(false);

  // Si l'admin ouvre le panel admin, on affiche l'écran admin
  if (showAdmin && isAdmin) {
    return <AdminScreen onBack={() => setShowAdmin(false)} />;
  }

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Tu veux vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
          }
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Compte supprimé', 'Ton compte a été supprimé avec succès.');
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Reconnexion nécessaire',
                  'Pour des raisons de sécurité, déconnecte-toi et reconnecte-toi avant de supprimer ton compte.'
                );
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer le compte.');
              }
            }
          },
        },
      ]
    );
  };

  const handleContact = async () => {
    const email = 'fieldz.app.contact@gmail.com';
    try {
      const canOpen = await Linking.canOpenURL(`mailto:${email}`);
      if (canOpen) {
        await Linking.openURL(`mailto:${email}?subject=Fieldz%20-%20Contact`);
      } else {
        Alert.alert('Email', `Écris-nous à ${email}`);
      }
    } catch {
      Alert.alert('Email', `Écris-nous à ${email}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FieldzLogo size="small" />
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Avatar + nom */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileCard}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>
            {user?.displayName ?? 'Sportif anonyme'}
          </Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.spotsAjoutes ?? 0}</Text>
            <Text style={styles.statLabel}>Spots ajoutés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile?.sportsExplores?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Sports explorés</Text>
          </View>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.menu}>
          <MenuItem
            emoji="📧"
            label="Nous contacter"
            onPress={handleContact}
          />
        </Animated.View>

        {/* Admin (visible uniquement pour les admins) */}
        {isAdmin && (
          <Animated.View entering={FadeInDown.delay(350)}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowAdmin(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.adminText}>Administration</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Déconnexion */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Supprimer mon compte (obligation Apple) */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>Fieldz v{Constants.expoConfig?.version ?? '1.0.0'}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Item de menu
const MenuItem: React.FC<{
  emoji: string;
  label: string;
  onPress: () => void;
}> = ({ emoji, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuEmoji}>{emoji}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

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
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text,
    marginTop: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.accent,
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xl,
    color: Colors.text,
  },
  email: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxl,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  menu: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuEmoji: {
    fontSize: 20,
    marginRight: 14,
  },
  menuLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  menuArrow: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 22,
    color: Colors.textMuted,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  deleteButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.md,
    color: Colors.error,
  },
  adminButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    alignItems: 'center',
  },
  adminText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.md,
    color: Colors.accent,
  },
  version: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
