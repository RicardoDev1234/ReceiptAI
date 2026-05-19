import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { getReceipts, deleteReceipt, computeTotals } from '../services/storageService';
import { exportReceiptsToCSV } from '../services/exportService';
import { COLORS, CATEGORY_COLORS } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function TotalsCard({ total, receiptCount }) {
  return (
    <View style={styles.totalsCard}>
      <Text style={styles.totalsLabel}>Total Spent</Text>
      <Text style={styles.totalsAmount}>${total.toFixed(2)}</Text>
      <Text style={styles.totalsCount}>{receiptCount} receipt{receiptCount !== 1 ? 's' : ''}</Text>
    </View>
  );
}

function CategoryChart({ byCategory }) {
  const entries = Object.entries(byCategory).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;

  const labels = entries.map(([k]) => k.split(' ')[0]);
  const data = entries.map(([, v]) => v);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>By Category</Text>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={SCREEN_WIDTH - 32}
        height={180}
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundGradientFrom: COLORS.white,
          backgroundGradientTo: COLORS.white,
          decimalPlaces: 0,
          color: () => COLORS.primary,
          labelColor: () => COLORS.textSecondary,
          propsForLabels: { fontSize: 10 },
        }}
        style={styles.chart}
        yAxisLabel="$"
        yAxisSuffix=""
      />
    </View>
  );
}

function ReceiptItem({ item, onDelete }) {
  const color = CATEGORY_COLORS[item.category] || COLORS.textSecondary;
  return (
    <View style={styles.receiptItem}>
      <View style={[styles.categoryDot, { backgroundColor: color }]} />
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptVendor} numberOfLines={1}>{item.vendor || 'Unknown'}</Text>
        <Text style={styles.receiptMeta}>{item.category || 'Other'} · {item.date || '—'}</Text>
      </View>
      <Text style={styles.receiptAmount}>${(item.amount ?? 0).toFixed(2)}</Text>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReceipts();
    setReceipts(data);
    setLoading(false);
  }, []);

  useFocusEffect(load);

  const handleDelete = (id) => {
    Alert.alert('Delete Receipt', 'Remove this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(id);
          setReceipts((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (receipts.length === 0) {
      Alert.alert('Nothing to Export', 'Add some receipts first.');
      return;
    }
    setExporting(true);
    try {
      await exportReceiptsToCSV(receipts);
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  const { total, byCategory } = computeTotals(receipts);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ReceiptAI</Text>
        <TouchableOpacity onPress={handleExport} style={styles.exportBtn} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.exportText}>Export CSV</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <TotalsCard total={total} receiptCount={receipts.length} />
            <CategoryChart byCategory={byCategory} />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Receipts</Text>
            {receipts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🧾</Text>
                <Text style={styles.emptyText}>No receipts yet.</Text>
                <Text style={styles.emptySubtext}>Tap the Scan tab to add your first receipt.</Text>
              </View>
            ) : (
              receipts.map((item) => (
                <ReceiptItem key={item.id} item={item} onDelete={handleDelete} />
              ))
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Scan')}>
        <Text style={styles.fabText}>+ Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  exportBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  exportText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100 },
  totalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  totalsLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  totalsAmount: { fontSize: 42, fontWeight: '700', color: COLORS.primary, marginVertical: 4 },
  totalsCount: { fontSize: 13, color: COLORS.textSecondary },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  chart: { borderRadius: 8, marginLeft: -16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  receiptInfo: { flex: 1 },
  receiptVendor: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  receiptMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  receiptAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginRight: 12 },
  deleteBtn: { padding: 4 },
  deleteText: { color: COLORS.textSecondary, fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
