import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportReceiptsToCSV(receipts) {
  const header = ['ID', 'Vendor', 'Date', 'Amount', 'Category', 'Items', 'Saved At'];
  const rows = receipts.map((r) => [
    r.id,
    r.vendor || '',
    r.date || '',
    r.amount != null ? r.amount.toFixed(2) : '0.00',
    r.category || '',
    Array.isArray(r.items) ? r.items.join('; ') : '',
    r.savedAt || '',
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');

  const filename = `receipts_${new Date().toISOString().slice(0, 10)}.csv`;
  const path = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Receipts CSV' });
}
