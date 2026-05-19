import AsyncStorage from '@react-native-async-storage/async-storage';

const RECEIPTS_KEY = '@receiptai_receipts';

export async function saveReceipt(receiptData) {
  const existing = await getReceipts();
  const newReceipt = {
    ...receiptData,
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
    amount: typeof receiptData.amount === 'number' ? receiptData.amount : 0,
  };
  const updated = [newReceipt, ...existing];
  await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
  return newReceipt;
}

export async function getReceipts() {
  const raw = await AsyncStorage.getItem(RECEIPTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteReceipt(id) {
  const existing = await getReceipts();
  const filtered = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(filtered));
}

export function computeTotals(receipts) {
  const total = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const byCategory = {};
  for (const r of receipts) {
    const cat = r.category || 'Other';
    byCategory[cat] = (byCategory[cat] ?? 0) + (r.amount ?? 0);
  }
  return { total, byCategory };
}
