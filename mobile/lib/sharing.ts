/**
 * Sharing utilities for PDF export and camera
 * Gracefully handles missing dependencies
 */

import { Platform, Alert } from 'react-native';

let Sharing: any = null;
let FileSystem: any = null;
let ImagePicker: any = null;

try {
  Sharing = require('expo-sharing');
} catch {
  // expo-sharing not installed
}

try {
  FileSystem = require('expo-file-system');
} catch {
  // expo-file-system not installed
}

try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

/**
 * Share a training plan PDF
 */
export async function sharePlanPdf(
  planId: string,
  apiUrl: string,
  authToken?: string
): Promise<boolean> {
  if (!Sharing || !FileSystem) {
    Alert.alert(
      'Recurso indisponível',
      'Instale expo-sharing e expo-file-system para compartilhar PDFs.'
    );
    return false;
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Compartilhamento',
        'Compartilhamento não disponível neste dispositivo.'
      );
      return false;
    }

    // Download PDF to local file
    const fileUri =
      (FileSystem.documentDirectory || '') + `plano_${planId}.pdf`;
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const download = await FileSystem.downloadAsync(
      `${apiUrl}/api/training-plans/${planId}/export/pdf`,
      fileUri,
      { headers }
    );

    if (download.status !== 200) {
      throw new Error('Falha ao baixar o plano');
    }

    await Sharing.shareAsync(download.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartilhar Plano de Treino',
    });

    return true;
  } catch (error: any) {
    console.error('Error sharing PDF:', error);
    Alert.alert('Erro', error.message || 'Falha ao compartilhar o plano.');
    return false;
  }
}

/**
 * Share a training plan as HTML
 */
export async function sharePlanHtml(
  planId: string,
  apiUrl: string,
  authToken?: string
): Promise<boolean> {
  if (!Sharing || !FileSystem) {
    Alert.alert(
      'Recurso indisponível',
      'Instale expo-sharing e expo-file-system para compartilhar planos.'
    );
    return false;
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Compartilhamento',
        'Compartilhamento não disponível neste dispositivo.'
      );
      return false;
    }

    // Download HTML to local file
    const fileUri =
      (FileSystem.documentDirectory || '') + `plano_${planId}.html`;
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const download = await FileSystem.downloadAsync(
      `${apiUrl}/api/training-plans/${planId}/export/html`,
      fileUri,
      { headers }
    );

    if (download.status !== 200) {
      throw new Error('Falha ao baixar o plano');
    }

    await Sharing.shareAsync(download.uri, {
      mimeType: 'text/html',
      dialogTitle: 'Compartilhar Plano de Treino',
    });

    return true;
  } catch (error: any) {
    console.error('Error sharing HTML:', error);
    Alert.alert('Erro', error.message || 'Falha ao compartilhar o plano.');
    return false;
  }
}

/**
 * Pick image from camera for assessment photos
 */
export async function pickImageFromCamera(): Promise<string | null> {
  if (!ImagePicker) {
    Alert.alert(
      'Recurso indisponível',
      'Instale expo-image-picker para usar a câmera.'
    );
    return null;
  }

  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso à câmera nas configurações.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<string | null> {
  if (!ImagePicker) {
    Alert.alert(
      'Recurso indisponível',
      'Instale expo-image-picker para acessar a galeria.'
    );
    return null;
  }

  try {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso à galeria nas configurações.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  } catch (error) {
    console.error('Gallery error:', error);
    return null;
  }
}

/**
 * Get image from camera or gallery (let user choose)
 */
export async function pickImage(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert('Selecionar Imagem', 'Escolha a fonte da imagem', [
      {
        text: 'Câmera',
        onPress: async () => {
          const uri = await pickImageFromCamera();
          resolve(uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const uri = await pickImageFromGallery();
          resolve(uri);
        },
      },
      {
        text: 'Cancelar',
        onPress: () => resolve(null),
        style: 'cancel',
      },
    ]);
  });
}

/**
 * Save image to file system
 */
export async function saveImage(
  sourceUri: string,
  fileName: string
): Promise<string | null> {
  if (!FileSystem) {
    Alert.alert(
      'Recurso indisponível',
      'Instale expo-file-system para salvar imagens.'
    );
    return null;
  }

  try {
    const destUri = (FileSystem.documentDirectory || '') + fileName;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });
    return destUri;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
}

/**
 * Delete image from file system
 */
export async function deleteImage(fileUri: string): Promise<boolean> {
  if (!FileSystem) {
    console.warn('expo-file-system not installed');
    return false;
  }

  try {
    await FileSystem.deleteAsync(fileUri);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get image info (size, dimensions, etc.)
 */
export async function getImageInfo(
  fileUri: string
): Promise<{ size: number } | null> {
  if (!FileSystem) {
    console.warn('expo-file-system not installed');
    return null;
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    return { size: fileInfo.size || 0 };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
}
