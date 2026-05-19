import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { extractReceiptData } from '../services/claudeService';
import { saveReceipt } from '../services/storageService';
import { COLORS, CATEGORIES, CATEGORY_COLORS } from '../theme';

function FieldRow({ label, children }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function CategoryPicker({ value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
      {CATEGORIES.map((cat) => {
        const selected = cat === value;
        const color = CATEGORY_COLORS[cat] || COLORS.textSecondary;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onChange(cat)}
            style={[
              styles.categoryChip,
              selected && { backgroundColor: color, borderColor: color },
            ]}
          >
            <Text style={[styles.categoryChipText, selected && { color: COLORS.white }]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function ResultScreen({ route, navigation }) {
  const { base64, mediaType } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await extractReceiptData(base64, mediaType);
        if (cancelled) return;
        setVendor(data.vendor || '');
        setDate(data.date || '');
        setAmount(data.amount != null ? String(data.amount) : '');
        setCategory(data.category || 'Other');
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid number for the amount.');
      return;
    }
    setSaving(true);
    try {
      await saveReceipt({ vendor, date, amount: parsedAmount, category, items });
      navigation.navigate('Dashboard');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing receipt with AI…</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>Receipt analyzed! Review and save.</Text>
      </View>

      <View style={styles.card}>
        <FieldRow label="Vendor">
          <TextInput
            style={styles.input}
            value={vendor}
            onChangeText={setVendor}
            placeholder="Store or restaurant name"
            placeholderTextColor={COLORS.textSecondary}
          />
        </FieldRow>

        <FieldRow label="Date">
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </FieldRow>

        <FieldRow label="Total Amount ($)">
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
        </FieldRow>

        <FieldRow label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </FieldRow>

        {items.length > 0 && (
          <FieldRow label="Items">
            <View style={styles.itemsList}>
              {items.map((item, i) => (
                <Text key={i} style={styles.itemText}>• {item}</Text>
              ))}
            </View>
          </FieldRow>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save Receipt</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.discardLink}>
        <Text style={styles.discardText}>Discard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.background },
  loadingText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.error, marginBottom: 8 },
  errorMessage: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  retryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  successIcon: { fontSize: 20, color: COLORS.white },
  successText: { color: COLORS.white, fontWeight: '600', fontSize: 14, flex: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    gap: 18,
  },
  fieldRow: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  categoryScroll: { marginTop: 2 },
  categoryChip: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  categoryChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  itemsList: { gap: 4 },
  itemText: { fontSize: 14, color: COLORS.text },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  saveBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  discardLink: { alignItems: 'center' },
  discardText: { fontSize: 14, color: COLORS.textSecondary, textDecorationLine: 'underline' },
});
