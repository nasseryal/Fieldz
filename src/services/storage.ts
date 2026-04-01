// Service de stockage photos — upload les images dans Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as ImagePicker from 'expo-image-picker';

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1440;
const IMAGE_QUALITY = 0.7;

// Compresse et upload une photo de spot
export const uploadSpotPhoto = async (
  uri: string,
  spotId: string
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `spots/${spotId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Ouvre la galerie pour choisir une photo
export const pickImage = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: IMAGE_QUALITY,
    exif: false,
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
    quality: IMAGE_QUALITY,
    exif: false,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};
