// Écran d'authentification — connexion / inscription / Apple
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';
import { FieldzLogo } from '../components/FieldzLogo';
import { signInWithEmail, signUpWithEmail, resetPassword, signInWithApple } from '../services/auth';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Oups', 'Remplis tous les champs');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Oups', 'Entre une adresse email valide');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Oups', 'Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Oups', 'Entre ton prénom');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (error: any) {
      const message = error.code === 'auth/user-not-found'
        ? 'Aucun compte avec cet email'
        : error.code === 'auth/wrong-password'
        ? 'Mot de passe incorrect'
        : error.code === 'auth/invalid-credential'
        ? 'Email ou mot de passe incorrect'
        : error.code === 'auth/email-already-in-use'
        ? 'Cet email est déjà utilisé'
        : error.code === 'auth/weak-password'
        ? 'Le mot de passe doit faire au moins 6 caractères'
        : 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  // Mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email requis', 'Entre ton email au-dessus, puis appuie sur "Mot de passe oublié"');
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Email envoyé ✉️', `Un lien pour réinitialiser ton mot de passe a été envoyé à ${email}`);
    } catch (error: any) {
      const message = error.code === 'auth/user-not-found'
        ? 'Aucun compte avec cet email'
        : 'Erreur lors de l\'envoi';
      Alert.alert('Erreur', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Logo */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.logoContainer}>
        <FieldzLogo size="large" />
        <Text style={styles.subtitle}>Trouve ton terrain de sport</Text>
      </Animated.View>

      {/* Formulaire */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
        <Text style={styles.title}>
          {isLogin ? 'Connexion' : 'Inscription'}
        </Text>

        {/* Bouton Sign in with Apple */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleButton}
            activeOpacity={0.8}
            onPress={async () => {
              try {
                setLoading(true);
                await signInWithApple();
              } catch (error: any) {
                // Code 1001 = l'utilisateur a annulé, pas une vraie erreur
                if (error.code !== 'ERR_REQUEST_CANCELED') {
                  Alert.alert('Erreur', 'Connexion Apple impossible');
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.appleButtonText}> Continuer avec Apple</Text>
          </TouchableOpacity>
        )}

        {/* Séparateur */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Champ prénom (inscription uniquement) */}
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Ton prénom"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        {/* Champ email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Champ mot de passe */}
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Mot de passe oublié (mode connexion uniquement) */}
        {isLogin && (
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        )}

        {/* Bouton principal */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Lien pour switcher connexion/inscription */}
        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  form: {
    gap: 14,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: FontSizes.xxl,
    color: Colors.text,
    marginBottom: 4,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  appleButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: FontSizes.md,
    color: '#000000',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
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
  forgotText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.accent,
    textAlign: 'right',
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
