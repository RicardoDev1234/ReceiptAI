import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme';

export default function ScanScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mediaType, setMediaType] = useState('image/jpeg');

  const requestAndPick = async (useCamera) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to scan receipts.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to pick a receipt.');
        return;
      }
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setBase64(asset.base64);
      const ext = asset.uri.split('.').pop()?.toLowerCase();
      setMediaType(ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
    }
  };

  const handleAnalyze = () => {
    if (!base64) return;
    navigation.navigate('Result', { base64, mediaType });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <Text style={styles.headerSub}>Take a photo or choose from your gallery</Text>
      </View>

      <View style={styles.previewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🧾</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.pickBtn, styles.btnCamera]} onPress={() => requestAndPick(true)}>
          <Text style={styles.pickBtnIcon}>📷</Text>
          <Text style={styles.pickBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pickBtn, styles.btnGallery]} onPress={() => requestAndPick(false)}>
          <Text style={styles.pickBtnIcon}>🖼️</Text>
          <Text style={styles.pickBtnText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
          <Text style={styles.analyzeBtnText}>Analyze with AI →</Text>
        </TouchableOpacity>
      )}

      {imageUri && (
        <TouchableOpacity onPress={() => { setImageUri(null); setBase64(null); }} style={styles.retakeLink}>
          <Text style={styles.retakeLinkText}>Clear image</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  previewBox: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderIcon: { fontSize: 56, marginBottom: 12 },
  placeholderText: { fontSize: 15, color: COLORS.textSecondary },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20, width: '100%' },
  pickBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnCamera: { backgroundColor: COLORS.primary },
  btnGallery: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary },
  pickBtnIcon: { fontSize: 18 },
  pickBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  analyzeBtn: {
    width: '100%',
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  retakeLink: { marginTop: 16 },
  retakeLinkText: { fontSize: 14, color: COLORS.textSecondary, textDecorationLine: 'underline' },
});
