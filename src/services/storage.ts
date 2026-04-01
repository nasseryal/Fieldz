// Service de stockage photos — upload les images dans Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as ImagePicker from 'expo-image-picker';

// Compresse et upload une photo de spot
export const uploadSpotPhoto = async (
  uri: string,
  spotId: string
): Promise<string> => {
  // Convertit l'image en blob (format envoyable)
  const response = await fetch(uri);
  const blob = await response.blob();

  // Crée un nom unique pour la photo
  const filename = `spots/${spotId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  // Upload vers Firebase Storage
  await uploadBytes(storageRef, blob);

  // Retourne l'URL publique de la photo
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Ouvre la galerie pour choisir une photo
export const pickImage = async (): Promise<string | null> => {
  // Demande la permission d'accéder à la galerie
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7, // Compression à 70% — bon compromis qualité/poids
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

// Ouvre la caméra pour prendre une photo
export const takePhoto = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};
