// Écran Profil — infos utilisateur, stats, favoris, déconnexion
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/auth';
import { FieldzLogo } from '../components/FieldzLogo';
import { importAllSports } from '../services/sportsData';

export const ProfileScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);

  // Import massif des spots depuis l'API gouvernementale
  const handleImportSpots = () => {
    Alert.alert(
      'Importer les spots',
      'On va récupérer ~100 terrains par sport depuis la base gouvernementale. Ça peut prendre 1-2 minutes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Importer',
          onPress: async () => {
            setImporting(true);
            setImportLog([]);
            try {
              const total = await importAllSports((sport, count) => {
                const msg = count === -1
                  ? `❌ ${sport} — erreur`
                  : count === 0
                  ? `⏭️ ${sport} — aucun résultat`
                  : `✅ ${sport} — ${count} spots importés`;
                setImportLog(prev => [...prev, msg]);
              });
              Alert.alert('Import terminé ! 🎉', `${total} spots importés au total`);
            } catch (error) {
              Alert.alert('Erreur', "L'import a échoué");
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Tu veux vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: () => signOut() },
      ]
    );
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
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.favoris?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.menu}>
          <MenuItem
            emoji="⭐"
            label="Mes favoris"
            onPress={() => {}}
          />
          <MenuItem
            emoji="📍"
            label="Mes contributions"
            onPress={() => {}}
          />
          <MenuItem
            emoji="⚙️"
            label="Paramètres"
            onPress={() => {}}
          />
          <MenuItem
            emoji="📧"
            label="Nous contacter"
            onPress={() => {}}
          />
        </Animated.View>

        {/* Section Admin — Import des spots */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.adminSection}>
          <Text style={styles.adminTitle}>🔧 Admin</Text>

          <TouchableOpacity
            style={[styles.importButton, importing && styles.buttonDisabled]}
            onPress={handleImportSpots}
            activeOpacity={0.7}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.importButtonText}>
                📥 Importer les spots (API gouvernementale)
              </Text>
            )}
          </TouchableOpacity>

          {/* Log d'import en temps réel */}
          {importLog.length > 0 && (
            <View style={styles.importLog}>
              {importLog.map((line, i) => (
                <Text key={i} style={styles.importLogLine}>{line}</Text>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Déconnexion */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>Fieldz v1.0.0</Text>

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
  adminSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  adminTitle: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.md,
    color: '#FFFFFF',
  },
  importLog: {
    marginTop: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  importLogLine: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: FontSizes.md,
    color: Colors.error,
  },
  version: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
